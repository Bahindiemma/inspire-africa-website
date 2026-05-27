# CI/CD

> Purpose: the GitHub Actions workflows for both repos — triggers, steps, image tags, secrets.
> Last reviewed: 2026-05-27 (commit 49a621a)

## Table of contents
- [1. Overview](#1-overview)
- [2. Website workflow](#2-website-workflow)
- [3. CMS workflow](#3-cms-workflow)
- [4. Build → deploy sequence](#4-build--deploy-sequence)
- [5. Secrets & permissions](#5-secrets--permissions)

---

## 1. Overview

Each repo has one workflow: `.github/workflows/docker-publish.yml`. Both build a Docker image and push it to GHCR on push to `main` (or manual `workflow_dispatch`). There is **no test/lint/typecheck job** — CI only builds and publishes. Deployment itself is a manual step on the VPS (`docker compose pull && up -d`).

| | Website | CMS |
|--|---------|-----|
| Workflow name | "Build and publish web image" | "Build and publish CMS image" |
| Image | `ghcr.io/bahindiemma/inspire-africa-website` (PUBLIC) | `ghcr.io/bahindiemma/inspire-africa-cms` (PRIVATE) |
| Tags | `latest` + `sha-<short>` | `latest` + `sha-<short>` |

## 2. Website workflow

Source: `.github/workflows/docker-publish.yml`.

- **Triggers**: `push` to `main` (ignoring `deploy/**` and `**.md`), and `workflow_dispatch`.
- **Permissions**: `contents: read`, `packages: write`.
- **Steps**:
  1. `actions/checkout@v4`
  2. `docker/login-action@v3` to `ghcr.io` (user `${{ github.actor }}`, password `${{ secrets.GITHUB_TOKEN }}`)
  3. `docker/metadata-action@v5` → tags `latest` + `sha,format=short`
  4. `docker/setup-buildx-action@v3`
  5. `docker/build-push-action@v6` — `context: .`, `push: true`, build-arg `NEXT_PUBLIC_SITE_URL=https://inspireafricans.com`, GHA layer cache (`cache-from/to: type=gha`).
- **Dockerfile**: 3-stage (`deps` via `npm install` → `builder` `npm run build` with `output: 'standalone'` → `runner` `node server.js` as non-root `nextjs`, EXPOSE 3000).

## 3. CMS workflow

Source: `inspire-africa-cms/.github/workflows/docker-publish.yml`.

- **Triggers**: `push` to `main` (ignoring `**.md`, `docs/**`, `render.yaml`), and `workflow_dispatch`.
- **Permissions**: `contents: read`, `packages: write`.
- **Steps**: identical structure to the website (checkout → GHCR login → metadata → buildx → build-push). No `NEXT_PUBLIC_*` build-arg (Strapi reads env at runtime).
- **Dockerfile**: 3-stage (builder with `npm ci --legacy-peer-deps` + `vips-dev` for sharp → prod-deps-only → runner with `vips` + `tini`, non-root `node`, `npm run start`, EXPOSE 1337).

## 4. Build → deploy sequence

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant GH as GitHub (main)
  participant GA as GitHub Actions
  participant R as GHCR
  participant S as VPS /opt/inspire-africa

  Dev->>GH: git push origin main
  GH->>GA: trigger docker-publish.yml
  GA->>GA: checkout → buildx build (GHA cache)
  GA->>R: push :latest + :sha-xxxx
  Note over S: manual deploy step (SSH :2021, 2FA)
  S->>R: docker compose pull (web public; cms private/on-host build)
  S->>S: docker compose up -d
  S->>S: docker image prune -f
```

## 5. Secrets & permissions

- **`GITHUB_TOKEN`** (auto-provided): used to push to GHCR; needs `packages: write` (granted in the workflow). No extra repo secrets are required for the build.
- **GHCR visibility**: the `website` package is PUBLIC (server pulls without auth). The `cms` package is PRIVATE — the server either logs in with a PAT (`read:packages`) to pull, or **builds the CMS image on-host** (ADR-008). Making the CMS package public would remove the friction.
- **Deploy secrets** (DB passwords, Strapi secrets, tokens) are **not** in CI — they live only in `/opt/inspire-africa/.env` on the VPS (see [Environment variables](./10-environment-variables.md) and [Deployment runbook](./12-deployment-runbook.md)).
- `paths-ignore` keeps docs/compose-only changes from triggering image rebuilds.
