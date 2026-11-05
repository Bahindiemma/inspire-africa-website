# INSPIRE AFRICA — Production Deployment Runbook

Runs two apps on the COTE Contabo host **37.60.225.220** (the same server as
the register and readiness) in the docker compose stack in `/opt/inspire-africa`:

| Service | Source repo | Image | How it gets there |
|---------|-------------|-------|-------------------|
| Web (Next.js) | `cotetech-client-projects/inspire-africa-website` | `ghcr.io/bahindiemma/inspire-africa-website:latest` (name only) | built by `deploy.yml`, loaded on the server; **not** in GHCR any more |
| CMS (Strapi)  | `cotetech-client-projects/inspire-africa-cms`      | `ghcr.io/bahindiemma/inspire-africa-cms`      | GHCR, `docker compose pull cms` |
| MySQL 8       | — (official image)                    | `mysql:8.0`                                   | — |

> **Note:** Claude could not perform these server steps — SSH is protected by
> 2FA. Run them yourself in your SSH session (`ssh -p 2021 root@37.60.225.220`).

---

## How a deploy happens now: merge to main

**Merging to `main` deploys. Nobody logs in to the server.** It works exactly
like the register and readiness:

1. A push to `main` runs **CI** (`.github/workflows/ci.yml`: lint, typecheck,
   production build).
2. When CI passes, **Deploy to production** (`.github/workflows/deploy.yml`)
   builds the docker image of that exact commit, hands it to the VPS as
   `gh-deploy` (a key that can deploy the website and nothing else) and runs
   `inspire-deploy website` on the server
   (`inspire-africa-community-vault/deploy/github-actions/`).
3. The server loads the image, recreates **only** `web` (`--no-deps`, so the CMS,
   MySQL and the uploads are untouched), puts the previous image back if the new
   one does not answer, revalidates every CMS page and collection, warms each
   page twice and checks every page for photographs and gated join links.
4. The workflow then checks from outside, through nginx and TLS, that
   https://inspireafricans.com serves this build's id.

A commit `main` has already moved past is skipped. To redeploy or roll back,
press **Actions → Deploy to production → Run workflow** with a branch, tag or
full SHA. Server log: `/var/log/inspire-deploy.log`. The previous image stays
on the server as `ghcr.io/bahindiemma/inspire-africa-website:rollback`.

Repo secrets (same names as readiness and the register): `DEPLOY_SSH_KEY` (the
website key), `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`, `DEPLOY_PORT`. The server
side is installed once by `provision-gh-deploy.sh` in the vault repo.

**Never `docker compose pull web`**, and never a bare `docker compose pull`, in
`/opt/inspire-africa`. Website builds are no longer published to GHCR, so a pull
would put an old site back. Update the CMS with `docker compose pull cms`.

## Re-warming without a new build — the script

```bash
ssh -i ~/.ssh/contabo_deploy -p 2021 root@37.60.225.220 bash -s < deploy/redeploy-web.sh
```

`deploy/redeploy-web.sh` recreates the `web` container from the image already
on the server (it never pulls), revalidates every page and collection, warms
each URL twice, then **verifies**: it exits non-zero if any page has lost its
photography or if any join CTA skips the signup page. CI builds where the CMS is
unreachable, so without the revalidation every CMS page ships with the
image-less fallback; that happened for thirteen days in August 2026 and again on
4 September 2026. Pages also carry `revalidate = 60` as a floor.

---

## First install (history, May 2026)

The phases below are how the stack was first stood up. The website half of
Phase 0 is out of date: `docker-publish.yml` was removed from this repo in
November 2026 and the website now ships through `deploy.yml` (above).

## Phase 0 — Push code so CI builds the images (your laptop)

Both repos now contain a `Dockerfile` + `.github/workflows/docker-publish.yml`.
Commit and push each; GitHub Actions builds and pushes the image to GHCR.

```bash
# Web repo
cd "INSPIRE AFRICA WEBSITE"
git add next.config.mjs Dockerfile .dockerignore .github deploy
git commit -m "Add Docker build, GHCR CI, and deploy bundle"
git push origin main

# CMS repo
cd "../inspire-africa-cms"
git add Dockerfile .dockerignore .github
git commit -m "Fix Docker build deps; add GHCR CI"
git push origin main
```

Watch both Actions runs go green: GitHub → repo → **Actions** tab.

### Make the GHCR packages pullable from the server

By default GHCR packages are **private**. Either:

- **Easiest:** make each package public — GitHub → your profile → **Packages**
  → select package → **Package settings** → *Change visibility* → Public.
  Then the server can `docker pull` with no login.
- **Or keep private** and create a Personal Access Token (classic) with
  `read:packages`. You'll `docker login ghcr.io` on the server with it (Phase 2).

---

## Phase 1 — Prepare the server (run once)

SSH in, then install Docker Engine + the compose plugin:

```bash
# Docker's official convenience script (Ubuntu 22.04)
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version
```

Open the web + CMS ports in the firewall (UFW shown; adjust if you use the
Webmin firewall module instead — keep 2021/SSH and 10000/Webmin open!):

```bash
ufw allow 80/tcp
ufw allow 1337/tcp
ufw status
```

---

## Phase 2 — Drop in the compose file + secrets

```bash
mkdir -p /opt/inspire-africa && cd /opt/inspire-africa
```

Copy `deploy/docker-compose.yml` and `deploy/.env.production.example` from the
web repo onto the server into `/opt/inspire-africa/`. Quickest way — fetch the
raw files from GitHub after the push (or paste them with `nano`):

```bash
# example if the repo is public:
curl -fsSLO https://raw.githubusercontent.com/Bahindiemma/inspire-africa-website/main/deploy/docker-compose.yml
curl -fsSL  https://raw.githubusercontent.com/Bahindiemma/inspire-africa-website/main/deploy/.env.production.example -o .env
```

Generate strong secrets and fill in `.env`:

```bash
# DB passwords (run twice, paste into DATABASE_PASSWORD and MYSQL_ROOT_PASSWORD)
openssl rand -base64 24

# Strapi secrets
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"
for k in API_TOKEN_SALT ADMIN_JWT_SECRET TRANSFER_TOKEN_SALT JWT_SECRET ENCRYPTION_KEY REVALIDATE_SECRET; do
  echo "$k=$(openssl rand -base64 32)"
done

nano .env   # paste the generated values; leave STRAPI_PUBLIC_TOKEN empty for now
```

If your GHCR packages are **private**, log in now:

```bash
echo "<YOUR_GHCR_PAT>" | docker login ghcr.io -u Bahindiemma --password-stdin
```

---

## Phase 3 — First boot

```bash
cd /opt/inspire-africa
docker compose pull
docker compose up -d
docker compose ps
docker compose logs -f cms   # wait for "Strapi is up" — first boot runs DB migrations
```

- CMS admin: **http://37.60.225.220:1337/admin** → create the first admin user.
- Site: **http://37.60.225.220** (renders static-fallback content until the
  API token is set in the next step).

---

## Phase 4 — Wire the site to the CMS

1. In Strapi admin → **Settings → API Tokens → Create new API Token**
   - Name: `nextjs-public-read`, Token type: **Read-only**, Duration: Unlimited.
2. Copy the token (shown once). On the server:
   ```bash
   cd /opt/inspire-africa
   nano .env        # set STRAPI_PUBLIC_TOKEN=<the token>
   docker compose up -d web   # recreates only the web container with the token
   ```
3. Reload **http://37.60.225.220** — it now reads live content from Strapi.

Set the publish webhook so edits refresh the site: Strapi → **Settings →
Webhooks → Create** → URL
`http://web:3000/api/revalidate?secret=<REVALIDATE_SECRET>`, events: Entry
publish/unpublish. (The CMS reaches `web` over the internal docker network.)

---

## Updating later

- **Website:** merge to `main`. That is the whole procedure (see the top of
  this file).
- **CMS:** push to its `main` → Actions publishes the image → on the server:

```bash
cd /opt/inspire-africa
docker compose pull cms          # name the service: a bare pull would downgrade web
docker compose up -d --no-deps cms
```

## Backups (do this before you rely on it)

```bash
# MySQL dump
docker compose exec db sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" inspire_africa_cms' > backup-$(date +%F).sql
# Uploaded media lives in the `cms_uploads` docker volume.
```

## Troubleshooting

- `docker compose logs cms` / `logs web` / `logs db` — per-service logs.
- CMS can't reach DB: confirm `db` is healthy (`docker compose ps`) and the
  `DATABASE_*` values in `.env` match the MySQL env.
- Site shows fallback content: `STRAPI_PUBLIC_TOKEN` missing/invalid, or
  `CORS_ORIGINS` doesn't include the site origin.
- 502 / can't reach a port: check `ufw status` and that the container is `Up`.
