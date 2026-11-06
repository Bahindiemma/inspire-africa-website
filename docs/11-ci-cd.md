# CI/CD

> Purpose: the GitHub Actions workflows for both repos — triggers, steps, image tags, secrets.
> Last reviewed: 2026-11-06

## Table of contents
- [1. Website](#1-website)
- [2. CMS](#2-cms)

---

## 1. Website

One workflow, `.github/workflows/deploy.yml`, the same pipeline as agribz. `mirror.yml` still copies the repo to the personal mirror.

| Job | Runs on | Does |
|-----|---------|------|
| `check` | every run | `npm run lint`, `npm run typecheck` (`next build` skips ESLint) |
| `build` | after `check` | Builds the image. Pushes to `ghcr.io/cotetech-client-projects/inspire-africa-website` except on a pull request |
| `deploy-dev` | push to `dev` | `.github/actions/deploy` with the `:dev` image, port 9601 |
| `deploy-production` | push to `main`, or **Run workflow** on `main` | `.github/actions/deploy` with `:latest`, port 9600 |

`.github/actions/deploy` checks its configuration, writes `.env`, copies the compose files to the server, pulls the image, recreates the container with the previous image kept for rollback, then revalidates every page and verifies photographs and join links from inside the server.

Variables, secrets and the one-time move off the old container: [deploy/README.md](../deploy/README.md).

## 2. CMS

`inspire-africa-cms` still builds with `docker-publish.yml` and is deployed by hand in `/opt/inspire-africa`. It has not moved to this pipeline yet.
