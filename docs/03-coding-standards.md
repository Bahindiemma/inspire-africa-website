# Coding Standards & Conventions

> Purpose: the conventions, tooling, and folder structure for the Next.js website repo.
> Last reviewed: 2026-05-27 (commit 49a621a)

## Table of contents
- [1. Language & tooling](#1-language--tooling)
- [2. TypeScript config](#2-typescript-config)
- [3. Linting](#3-linting)
- [4. Styling (Tailwind v4)](#4-styling-tailwind-v4)
- [5. Folder conventions](#5-folder-conventions)
- [6. Naming](#6-naming)
- [7. Component & data patterns](#7-component--data-patterns)
- [8. Branch / commit / PR model](#8-branch--commit--pr-model)

---

## 1. Language & tooling

| Concern | Choice | Source |
|---------|--------|--------|
| Framework | Next.js 15.5 App Router | `package.json`, `app/` |
| UI lib | React 19.0.0 | `package.json` |
| Language | TypeScript 5.7.3, `strict` | `tsconfig.json` |
| Styling | Tailwind CSS v4 + semantic CSS classes | `app/globals.css`, `postcss.config.mjs` |
| Lint | ESLint 9 flat config, `next/core-web-vitals` + `next/typescript` | `eslint.config.mjs` |
| Package manager | npm (lockfile committed) | `package-lock.json` |

## 2. TypeScript config

From `tsconfig.json`:
- `target: ES2022`, `module/moduleResolution: esnext/bundler`.
- `strict: true`, plus extra safety: `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`.
- `allowJs: false` — TS/TSX only.
- Path alias: `@/*` → repo root (e.g. `@/lib/strapi`, `@/components/ui/Button`).
- `noEmit: true` — Next.js handles emit; run `npm run typecheck` for a standalone check.

Note: the Strapi typing layer (`lib/strapi.ts`, `lib/cms/*`) uses `any` in places (Strapi v5 dynamic-zone payloads). This is intentional; lint errors from it must not block builds — hence `eslint.ignoreDuringBuilds` (see below).

## 3. Linting

- `eslint.config.mjs` extends `next/core-web-vitals` and `next/typescript`; only override is `react/no-unescaped-entities: off`.
- **ESLint does NOT gate the production build** — `next.config.mjs` sets `eslint: { ignoreDuringBuilds: true }`. Lint is still available via `npm run lint`. Run it (and `npm run typecheck`) before opening a PR.

## 4. Styling (Tailwind v4)

- `app/globals.css` starts with `@import "tailwindcss"` and defines brand tokens in an `@theme` block (single brand yellow `#F8BD26`, Madimi One typeface, breakpoints).
- Components largely use **semantic CSS classes** (e.g. `.hero`, `.audience-card`, `.proof`) defined in `globals.css`, not utility soup. Match the existing class vocabulary when adding sections.
- Theme: light is default; dark via `[data-theme="dark"]`. A blocking inline script in `app/layout.tsx` sets `data-theme` before first paint (no flash) and polyfills `MediaQueryList.addListener`. System theme is the default (`localStorage 'inspire-theme'`).
- The brand typeface (Madimi One) is loaded via three independent fallback paths (next/font, Google CDN `<link>`, in-repo `.ttf`) — see `app/layout.tsx`.

## 5. Folder conventions

```
app/                  App Router routes (one folder = one route)
  api/                Route handlers (analytics proxy, revalidate webhook)
  <route>/page.tsx    Page component (server component by default)
  layout.tsx          Root layout: providers, header/footer, JSON-LD, fonts
  sitemap.ts robots.ts manifest.ts   Metadata routes
components/
  analytics/          AnalyticsTracker (client)
  cms/                DynamicZoneRenderer (maps Strapi sections → React)
  consent/            ConsentProvider, CookieConsent, CookieSettingsLink (client)
  forms/              Contact/Employers/Governments form stubs (client)
  layout/             Header, Footer, MobileNav, BackToTop, reveal controller
  legal/              LegalLayout, LegalMeta
  sections/           Reusable page sections (Hero, FeatureList, Numbers, …)
  theme/              ThemeProvider, ThemeSwitch (client)
  ui/                 Primitives (Button, Eyebrow, Brand, ArrowIcon)
lib/
  strapi.ts           Typed Strapi fetcher + buildQs
  cms/                Per-content-type fetchers (pages, blogs, corridors, legal, site-settings, utm)
  analytics/tracker.ts  Browser tracking client
  consent.ts          Consent cookie model + GPC/DNT
  seo.ts site.ts blogs.ts utm.ts   SEO helpers + static fallback content
public/               Static assets (images, fonts, icons)
deploy/               docker-compose + prod env example + deploy README
.github/workflows/    CI
```

## 6. Naming

- **Components**: PascalCase files and exports (`Hero.tsx` → `export function Hero`).
- **lib modules**: kebab/lowercase filenames; named exports (`getPage`, `buildMetadata`, `joinUrl`).
- **Routes**: lowercase folder = URL segment; dynamic segments in brackets (`app/blog/[slug]/page.tsx`).
- **Env vars**: `SCREAMING_SNAKE_CASE`; browser-exposed vars MUST be prefixed `NEXT_PUBLIC_` (only `NEXT_PUBLIC_SITE_URL` is exposed).
- **CMS Dynamic Zone components**: `sections.<name>` / `blocks.<name>` — the renderer switches on `__component` (`components/cms/DynamicZoneRenderer.tsx`).

## 7. Component & data patterns

- **Server components by default.** Pages are `async` server components that fetch via `lib/cms/*` (e.g. `app/page.tsx`, `app/approach/page.tsx`). Mark client components with `"use client"` (consent, theme, forms, tracker, mobile nav).
- **Always provide a fallback.** Every `lib/cms/*` fetcher returns static in-repo content if Strapi is unreachable. Preserve this when adding fetchers.
- **ISR over no-store.** Use the `revalidate` + `tags` options on `strapiFetch` so the revalidate webhook can target tags. Defaults: pages/blogs 60s, settings/corridors/legal 300s.
- **Metadata** comes from `lib/seo.ts` `buildMetadata({title, description, path})` per page; the root layout adds Organization + WebSite JSON-LD.
- **Adding a new CMS section type**: (1) add a `case 'sections.foo'` to `DynamicZoneRenderer`; (2) add the populate fragment in `lib/cms/pages.ts` `SECTION_POPULATE`; (3) ensure the matching component JSON exists in the CMS repo.

## 8. Branch / commit / PR model

`TODO/UNVERIFIED`: no `CONTRIBUTING.md`, PR template, branch-protection, or pre-commit hooks are present in the repo. The conventions below are the observed/recommended baseline — confirm with the team and codify if desired.

- **Default branch**: `main`. CI builds + publishes the web image on every push to `main` (`.github/workflows/docker-publish.yml`).
- **Recommended**: feature branches → PR into `main`; run `npm run lint` and `npm run typecheck` locally first (CI does not lint/typecheck — it only builds the image).
- **Commits**: recent history uses short imperative subjects (e.g. `SEO: HTTPS canonical/OG URLs…`, `Make system (OS) the default colour theme`). Keep that style. Docs commits in this set are prefixed `docs:`.
- **Secrets**: never commit `.env*`; `.gitignore` already excludes them and the deployment `.docx`/`.md`. This repo is PUBLIC.
