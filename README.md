# INSPIRE AFRICA — Website

Production website for **INSPIRE AFRICA** — labour-mobility infrastructure
connecting Africa's workforce to global employers and governments through
governed migration pathways, predictive screening and migration finance.

Live at: [inspireafricans.com](https://inspireafricans.com)

---

## Stack

| Layer            | Choice                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| Framework        | [Next.js 15](https://nextjs.org/) — App Router, React 19, Server Components       |
| Language         | [TypeScript 5.7](https://www.typescriptlang.org/) (strict)                        |
| Styling          | [Tailwind CSS v4](https://tailwindcss.com/) with `@theme` CSS-first tokens        |
| Fonts            | `next/font/google` — **Madimi One** as the single brand typeface (self-hosted)    |
| Images           | `next/image` — AVIF / WebP with tuned device-size cohorts                         |
| Theming          | Custom `ThemeProvider` (light / dark / system) using modern `addEventListener`    |
| Linting          | ESLint 9 + `eslint-config-next`                                                   |
| Engine           | Node ≥ 20                                                                         |

> **Why a custom ThemeProvider?** The earlier `next-themes` 0.4.x dependency
> still calls the deprecated `MediaQueryList.addListener` API, which throws
> "Cannot read properties of undefined (reading 'addListener')" in
> certain environments. The in-house provider (`components/theme/ThemeProvider.tsx`,
> ~90 lines) exposes the same `useTheme()` shape and only uses
> `addEventListener("change", …)`. The dependency is no longer needed.

---

## Getting started

```bash
npm install
cp .env.example .env.local      # optional — override the public site URL
npm run dev                     # http://localhost:3000
```

### Scripts

| Command              | Description                                |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Start the dev server with hot reload       |
| `npm run build`      | Production build (static + RSC)            |
| `npm start`          | Serve the production build                 |
| `npm run lint`       | ESLint + Next.js core-web-vitals rules     |
| `npm run typecheck`  | `tsc --noEmit` strict TypeScript check     |

### Environment

`.env.example` documents the supported variables. The only required one in
production is `NEXT_PUBLIC_SITE_URL` — used by `lib/seo.ts` when building
canonical / Open Graph URLs and by `app/sitemap.ts`.

---

## Project layout

```
app/                                App Router routes
  layout.tsx                        Root layout, fonts, providers, header/footer
                                    Inline blocking script: MediaQueryList
                                    polyfill + pre-paint theme application
  page.tsx                          Homepage
  approach/page.tsx                 Our Approach
  workers/page.tsx                  For Workers
  employers/page.tsx                For Employers (+ Hire Talent form)
  governments/page.tsx              For Governments (+ Partner With Us form)
  join/page.tsx                     Join the Community
  contact/page.tsx                  Contact (+ form)
  privacy/page.tsx                  Privacy Policy
  cookies/page.tsx                  Cookie Policy
  terms/page.tsx                    Terms of Use
  modern-slavery/page.tsx           Modern Slavery Statement
  blog/[slug]/page.tsx              Dynamic blog detail (statically prerendered)
  sitemap.ts                        /sitemap.xml (includes blog URLs)
  robots.ts                         /robots.txt
  not-found.tsx                     404 page
  globals.css                       Design tokens + base styles + all components

components/
  layout/                           SiteHeader, SiteFooter, MobileNav, BackToTop,
                                    RevealController, HeaderScroll, NavLinks
  theme/                            ThemeProvider, ThemeSwitch (light/dark/system)
  ui/                               Brand (transparent PNG logo), Button,
                                    ArrowIcon, Eyebrow
  sections/                         Hero, PageSection, FeatureList, ProcessList,
                                    StepCards, Numbers, FinalCta
  legal/                            LegalLayout (sticky TOC + body),
                                    LegalMeta, LegalHeading, LegalCallout
  forms/                            ContactForm, EmployersForm, GovernmentsForm

lib/
  site.ts                           Brand constants, nav links, corridor list,
                                    CORRIDOR_SECTORS (used by home marquee)
  utm.ts                            Mighty Networks join-link builder
                                    (UTM-aware, source-attributed)
  seo.ts                            Per-page metadata + Organization JSON-LD
  blogs.ts                          BlogPost type + 3 sample posts +
                                    helpers (getBlogPost, getRelatedPosts,
                                    formatBlogDate)

public/
  inspire-africa-logo.png           Transparent-background brand mark
  inspire-africa-logo.jpg           Legacy JPEG (retained, no longer referenced)
  images/                           Brand photography (inspire-*)
  nhs_*.jpg                         Testimonial photography
  fonts/                            Madimi One fallback (ultimate font fallback)
```

---

## Design system

### Brand colors

The palette is intentionally minimal — one yellow, one black, neutrals.

| Token                | Value                                          | Use                            |
| -------------------- | ---------------------------------------------- | ------------------------------ |
| `--yellow`           | `#F8BD26`                                      | Single brand yellow throughout |
| `--yellow-bright`    | `#F8BD26` (alias)                              | Legacy alias — same color      |
| `--yellow-deep`      | `#F8BD26` (alias)                              | Legacy alias — same color      |
| `--text`             | `#0a0a0a` light · `#ffffff` dark               | Body copy                      |
| `--bg`               | `#fafaf7` light · `#0a0a0a` dark               | Page background                |
| `--surface`          | `#ffffff` light · `#141414` dark               | Card surface                   |
| `--accent-display`   | `var(--yellow)`                                | Large display accents (h1, h2) |
| `--accent-ink`       | `var(--text)` light · `var(--yellow)` dark     | Small UI text accents          |

**Why only one yellow?** Per brand direction (May 2026), the previous
two-yellow system (`#FFC107` bright + `#b8930a` burnt) was unified to a
single `#F8BD26`. The `*-bright` and `*-deep` tokens are kept as aliases
so older selectors continue to work without re-introducing a second shade.

### Typography

**Madimi One** is the single brand typeface, applied across every text
role (display, body, buttons, forms). Delivered via three independent paths
so the site never falls back to a system font:

1. `next/font/google` — Google Fonts downloaded at build time, self-hosted under `/_next/static/media` (primary)
2. Google Fonts CDN `<link>` in `<head>` — runtime fallback
3. `/public/fonts/MadimiOne-Regular.ttf` + `@font-face` declaration — in-repo ultimate fallback

### Layout primitives

- `.container` — page-width wrapper, `max-width: 1320px`, fluid padding
- `.section-grid` — 2-col layout for inner pages (collapses at 980px)
- `.hero-grid` — 2-col hero layout (collapses at 960px)
- `.eyebrow` — small uppercase label with yellow accent bar
- `.btn` / `.btn--primary` / `.btn--ghost` / `.btn--dark` — button variants
- `.reveal` — IntersectionObserver-driven enter animation (`RevealController`)

### Responsive & no-scroll guarantees

- `html` and `body` use `overflow-x: clip` so no descendant can produce
  horizontal scroll on mobile
- All grid templates use `minmax(0, …fr)` so flex/grid children can
  shrink below their min-content width
- `overflow-wrap: anywhere` on long-tail text (emails, URLs) prevents
  unbreakable strings from forcing the viewport wider
- The mobile drawer uses `visibility: hidden` + `pointer-events: none`
  when closed so its `transform: translateX(100%)` doesn't extend
  `document.scrollWidth`
- Verified at 320 / 360 / 375 / 414 / 540 / 768 px via headless Chrome —
  `window.scrollX` stays at `0` after `window.scrollTo(9999, 0)` on every
  page

---

## Content

### Pages

| Route                          | Purpose                                                                   |
| ------------------------------ | ------------------------------------------------------------------------- |
| `/`                            | Marketing home — hero, audiences, proof, insights, final CTA              |
| `/approach`                    | Operating principles + 7-stage journey                                    |
| `/workers`                     | Worker-facing pitch + protections                                         |
| `/employers`                   | Employer-facing pitch + Hire Talent form                                  |
| `/governments`                 | Governments / agencies + Partner With Us form                             |
| `/join`                        | Community entry point + benefits + first-week journey                     |
| `/contact`                     | Two-column hero + contact form + office contact rail                      |
| `/blog/[slug]`                 | Dynamic blog detail (statically prerendered for known slugs)              |
| `/privacy`, `/cookies`, `/terms`, `/modern-slavery` | Legal documents with sticky TOC + structured body |

### Home page sections (top → bottom)

1. **Hero** — brand watermark, headline with display + accent + italic, lede, dual CTA, photo with yellow caption
2. **Corridors marquee** — CSS-only auto-scrolling strip of `{ country · sector }` chips with edge fade and hover-pause; respects `prefers-reduced-motion`
3. **Audiences** — three-card grid (Workers / Employers / Governments), first card filled yellow
4. **Proof** — four-stat numbers band + three testimonial cards with `Worker voice` / `Employer voice` / `Government voice` flags
5. **Insights** — three blog posts in an **alternating-rows** layout (image-left / image-right / image-left) with hairline dividers; each row has category tag, meta strip, headline (with animated yellow underline on hover), excerpt, CTA
6. **Final CTA** — full-bleed yellow section with display headline and primary CTA

### Blog system

Posts are authored in `lib/blogs.ts` as a `BlogPost[]` using a discriminated
`BlogSection` union:

```ts
type BlogSection =
  | { kind: "lede"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "list"; ordered?: boolean; items: string[] }
  | { kind: "callout"; title: string; text: string }
  | { kind: "quote"; text: string; attribution?: string };
```

Each post has: `slug`, `title`, `excerpt`, `category`, `author`, `authorRole`,
`date` (ISO), `readMinutes`, `heroImage`, `heroAlt`, `tags`, `body`.

To add a post: append a new entry to `BLOG_POSTS` in `lib/blogs.ts`. The
home insights section, `/blog/[slug]` route, related-posts rail, and
`/sitemap.xml` all pick it up automatically — no other file needs to
change. `generateStaticParams` on the detail route prerenders all known
slugs at build time; unknown slugs return a proper 404.

The three seed posts cover current labour-mobility realities:

1. **The real cost of "free" migration** — recruitment fees on West Africa → Gulf corridors, ILO 2025 data, the employer-pays principle
2. **UK care sector at breaking point** — 2026 Health & Care Worker visa amendments, sponsor licence enforcement, NHS staffing
3. **From remittance to reinvestment** — $100B+ remittance flows, the Earn-Learn-Return cycle, why governments are paying attention

The blog detail page uses an editorial centered hero (back-link top-left,
category chip + title + excerpt + meta centered), a bordered yellow cover
frame, a structured body renderer that walks the `BlogSection[]` union,
tags strip, two-up related posts, and a final CTA.

### Forms

Forms in `components/forms/` are typed React client components. In
production the corresponding native Wix Forms widgets handle submission
and routing; the form IDs / handler endpoints are documented in inline
notes inside each component.

---

## SEO

- Per-page metadata via `lib/seo.ts → buildMetadata({ title, description, path, image })` — produces canonical URL, Open Graph, and Twitter cards
- Blog posts each emit their own OG/Twitter cards using their `heroImage`
- Site-level metadata + Organization JSON-LD in `app/layout.tsx`
- `app/sitemap.ts` enumerates all routes including every `/blog/[slug]` URL with the post's publication date as `lastModified`
- `app/robots.ts` exposes the sitemap
- All public routes are statically generated (RSC + `metadata` exports + `generateStaticParams` for `/blog/[slug]`)
- Security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, `X-DNS-Prefetch-Control`) configured in `next.config.mjs`

---

## Theming

- Light / dark / system, controlled by a custom `ThemeProvider` (`components/theme/ThemeProvider.tsx`)
- Preference persisted to `localStorage.inspire-theme`; reflected on `<html data-theme="…">`
- Inline blocking script in `<head>` applies the saved theme **before first paint** to prevent flash
- Same script polyfills `MediaQueryList.prototype.addListener` / `removeListener` onto the prototype if missing — eliminates "Cannot read properties of undefined (reading 'addListener')" errors caused by extensions or third-party dev tools
- System-mode listens for OS preference changes via `addEventListener("change", …)` (modern API)
- Cross-tab sync via `storage` event

---

## Performance

- Self-hosted Madimi One via `next/font` with `display: swap` and CSS variables
- `next/image` with AVIF + WebP and tuned device-size cohorts (`360, 640, 750, 828, 1080, 1200, 1440, 1920, 2048`)
- Hero images marked `priority`
- Logo ships as a true-transparent PNG (luminance-based alpha extraction) — no blend-mode hacks needed on dark surfaces
- Server Components by default; client components only where state is required (theme switch, mobile nav, scroll affordances, forms, reveal controller)
- Compression enabled at the framework level (`next.config.mjs → compress: true`)

---

## Accessibility

- Semantic landmarks throughout (`<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>`, `<aside>`)
- Skip-to-content via the natural document order (no `outline: none` traps)
- `:focus-visible` rings on all interactive elements
- Mobile drawer traps focus while open and returns focus to the trigger on close
- `aria-current="page"` on active nav links, `aria-modal` + `role="dialog"` on the drawer
- All images that carry meaning have alt text; decorative images use `alt=""`
- `prefers-reduced-motion` respected by the corridors marquee (falls back to a static wrapped row) and by the reveal-on-scroll animations

---

## Deployment

The project is a standard Next.js app and deploys cleanly to Vercel,
Netlify, Render, or any Node host:

```bash
npm run build
npm start              # serves on $PORT or 3000
```

Environment variable to set in your deployment:

| Variable                | Example                          | Required |
| ----------------------- | -------------------------------- | -------- |
| `NEXT_PUBLIC_SITE_URL`  | `https://inspireafricans.com`    | Production |

---

## Browser support

Tested on the current versions of Chrome, Safari, Firefox, and Edge.

- Uses `overflow-x: clip` (Chrome 90+, Safari 16+, Firefox 81+) for the
  horizontal-scroll safety net
- Uses `text-wrap: balance` / `pretty` for headline + paragraph layout
  (gracefully degrades to default wrapping on older browsers)
- `mask-image` on the corridors marquee falls back to no fade on older
  browsers — content still readable

---

## License

© Inspire Africa Platform Ltd. Registered in England and Wales,
company number 12759109. All rights reserved.
