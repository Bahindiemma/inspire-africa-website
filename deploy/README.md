# INSPIRE AFRICA — Production Deployment Runbook

## The website

`.github/workflows/deploy.yml` builds the image, pushes it to GHCR and runs it on the COTE
server with docker compose, the same way as agribz. Merging to `main` deploys production.
Lint and typecheck must pass first. Use **Run workflow** on `main` to redeploy by hand.

Every deploy also revalidates each page and checks it from inside the server. CI builds where
the CMS is unreachable, so without that step the site ships with no photographs, which happened
for thirteen days in August 2026 and again on 4 September 2026. If a new image does not answer,
the previous one is put back and the job fails.

### GitHub settings (repo level, not per environment)

The org is on the free plan, so a private repo cannot hold environment secrets. The tokens must
match the CMS, so copy them from `/opt/inspire-africa/.env`.

| Kind | Name | Value |
|---|---|---|
| Secret | `SSH_KEY` | Private key that can log in to the server |
| Variable | `VPS_HOST` | `37.60.225.220` |
| Variable | `VPS_USER` | `root` |
| Variable | `VPS_PORT` | Optional, default `2021` |
| Variable | `REGISTER_API_URL` | From `/opt/inspire-africa/.env` |
| Secret | `STRAPI_PUBLIC_TOKEN` | From `/opt/inspire-africa/.env` |
| Secret | `REVALIDATE_SECRET` | From `/opt/inspire-africa/.env` |
| Secret | `ANALYTICS_INGEST_TOKEN` | From `/opt/inspire-africa/.env` |
| Secret | `COMMUNITY_SIGNUP_TOKEN` | From `/opt/inspire-africa/.env` |
| Secret | `REGISTER_WEBSITE_KEY` | From `/opt/inspire-africa/.env` |

Optional, with these defaults: `PROJECT_DIR` (`/var/www/clients/inspire-website`), `APP_PORT`
(`9600`), `APP_URL`, `STRAPI_MEDIA_URL` (`https://inspireafricans.com`), `STRAPI_BASE_URL`
(`http://cms:1337`) and `CMS_NETWORK` (`inspire-africa_internal`). A deploy with a required value
missing stops before it touches the server and names what is missing.

The dev job only runs if a `dev` branch is pushed (`APP_URL_DEV`, `PROJECT_DIR_DEV`, `APP_PORT_DEV`).
It reads the live CMS but gets no signup, analytics or register keys, so its forms fail closed.

### Moving off the old `web` container (once)

The first deploy starts the new container next to the old one, on `127.0.0.1:9600`. The live site
does not change until host nginx is pointed at it.

```bash
curl -I http://127.0.0.1:9600/      # expect 200

# In the inspireafricans.com vhost, on the site's own location only (not /admin, /api, /uploads):
#   proxy_pass http://127.0.0.1:3000;  ->  proxy_pass http://127.0.0.1:9600;
nginx -t && systemctl reload nginx

cd /opt/inspire-africa
docker compose stop web && docker compose rm -f web
# Then delete the `web:` service from /opt/inspire-africa/docker-compose.yml, or the next
# `docker compose up` there brings the old site back.
```

To undo before removing the container, put 3000 back and reload nginx.

**Never set `PROJECT_DIR` to `/opt/inspire-africa`.** The pipeline runs `down --remove-orphans` and
rewrites `.env` in that directory, which would take the CMS and its database with it. It refuses any
directory it does not already own.

---

# The CMS stack

The steps below still describe the CMS and MySQL in `/opt/inspire-africa`. Ignore what they say about
`web`. Logging in to the server by hand needs 2FA (`ssh -p 2021 root@37.60.225.220`).

---

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

The website deploys itself when a change merges to `main`. For the CMS, in `/opt/inspire-africa`:

```bash
docker compose pull cms
docker compose up -d cms
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
