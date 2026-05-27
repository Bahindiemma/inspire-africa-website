# Testing Strategy

> Purpose: what test coverage exists today, and the gaps to close.
> Last reviewed: 2026-05-27 (commit 49a621a)

## Table of contents
- [1. Current state](#1-current-state)
- [2. What exists](#2-what-exists)
- [3. Gaps](#3-gaps)
- [4. Recommended approach](#4-recommended-approach)

---

## 1. Current state

**There is no automated test suite in the website repo.** `package.json` defines no `test` script; there is no test runner (Jest/Vitest/Playwright), no `__tests__`, and no `coverage` config (though `.gitignore` reserves `/coverage`). CI (`.github/workflows/docker-publish.yml`) only builds and pushes the Docker image — it does not run tests, lint, or typecheck.

The only quality gates available today:
- `npm run lint` — ESLint (manual; not in CI; not in build).
- `npm run typecheck` — `tsc --noEmit` (manual; not in CI). The standalone `next build` does typecheck as part of compilation, so the **image build will fail on type errors** even though lint is ignored.

## 2. What exists

| Asset | Location | What it covers |
|-------|----------|----------------|
| TypeScript strict mode | `tsconfig.json` | Compile-time correctness; build fails on type errors |
| CMS smoke test | `inspire-africa-cms/scripts/smoke-test.sh` (`npm run test:smoke`) | Black-box HTTP checks against a running CMS: public reads return 200, PII reads (`candidates`, `form-submissions` GET) return 403, public `form-submission` POST returns 201. Requires `STRAPI_BASE_URL` + `STRAPI_PUBLIC_TOKEN`. |

The CMS smoke test is the single executable test artefact across both repos. It is an excellent contract check for the public API surface and the PII boundary.

## 3. Gaps

- No unit tests for the analytics tracker (`lib/analytics/tracker.ts`) — session/batch/scroll logic is untested.
- No unit tests for consent logic (`lib/consent.ts`) — GPC/DNT handling, version bump re-prompt, cookie parse.
- No unit tests for the server route handlers (`app/api/analytics/route.ts` same-origin guard + size cap; `app/api/revalidate/route.ts` secret check + tag/path mapping).
- No tests for the CMS analytics pipeline (`validate.ts`, `ip.ts` truncation/hash, `ua.ts` bot scoring, `rate-limit.ts`) — these are pure functions and ideal unit-test targets.
- No e2e/integration tests for the publish → revalidate flow or the rendering fallback.
- CI runs no checks beyond the image build.

## 4. Recommended approach

A pragmatic, low-friction plan (recommendation — `TODO/UNVERIFIED` whether the team wants to adopt it):

1. **Unit (fast, high value first):** add Vitest. Cover pure functions:
   - website: `lib/consent.ts`, `lib/analytics/tracker.ts` (extract pure helpers), `lib/seo.ts buildMetadata`, `lib/utm.ts joinUrl`.
   - CMS: `utils/analytics/{validate,ip,ua,rate-limit}.ts`.
2. **Route handlers:** test `app/api/analytics/route.ts` (403 on cross-origin, 204 on no-op, size cap) and `app/api/revalidate/route.ts` (403 on bad secret, correct tag/path invalidation per collection).
3. **Contract:** wire `scripts/smoke-test.sh` into the CMS CI against an ephemeral SQLite boot.
4. **CI gate:** add `npm run lint` + `npm run typecheck` (+ unit tests) as a job that runs before/alongside the image build in both repos.
5. **e2e (optional):** Playwright smoke — homepage renders, consent banner appears, accepting fires a beacon to `/api/analytics`.
