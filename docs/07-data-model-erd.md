# Data Model / ERD

> Purpose: the CMS content model — entities, relations, key fields, and the `private`/PII + analytics-privacy markings.
> Last reviewed: 2026-05-27 (commit 49a621a)
> Source: `inspire-africa-cms` schemas under `src/api/*/content-types/*/schema.json` (read via `/tmp/cms-edit`).

## Table of contents
- [1. ERD](#1-erd)
- [2. Content entities](#2-content-entities)
- [3. PII / restricted entities](#3-pii--restricted-entities)
- [4. Analytics entities](#4-analytics-entities)
- [5. Components (reusable field groups)](#5-components-reusable-field-groups)
- [6. Privacy markings](#6-privacy-markings)

---

## 1. ERD

```mermaid
erDiagram
  AUTHOR ||--o{ BLOG_POST : writes
  BLOG_POST }o--o{ TAG : tagged
  JOB_POSTING }o--o{ TAG : tagged
  CANDIDATE }o--o{ TAG : "skillTags"
  CANDIDATE }o--|| UP_USER : "assignedAgent (private)"
  ANALYTICS_SESSION ||--o{ ANALYTICS_EVENT : has

  PAGE { uid slug PK "dynamiczone sections" }
  BLOG_POST { uid slug PK "dynamiczone body" }
  LEGAL_DOCUMENT { enum slug PK "dynamiczone body" }
  JOB_POSTING { uid slug PK }
  CORRIDOR { string country PK }
  AUTHOR { uid slug PK }
  TAG { uid slug PK }
  FORM_DEFINITION { enum formKey PK }
  FORM_SUBMISSION { email "PII, private fields" }
  CANDIDATE { email "PII, private fields" }
  SITE_SETTING { single-type }
  NAVIGATION { single-type }
  DESIGN_TOKEN { single-type }
  ANALYTICS_SESSION { string sessionId PK "ipHash private" }
  ANALYTICS_EVENT { enum type }
  ANALYTICS_DAILY_ROLLUP { date date PK }
  UP_USER { plugin users-permissions }
```

Note: most content types have no explicit foreign-key relations to each other (they're composed via Dynamic Zones and embedded components). The relations that DO exist are author↔blog-post, blog-post/job-posting/candidate↔tag, candidate↔user (assignedAgent), and analytics-session↔analytics-event.

## 2. Content entities

### Page (`api::page.page`) — collection, draft&publish, i18n
| Field | Type | Notes |
|-------|------|-------|
| title | string (req, i18n) | |
| slug | uid → title (req) | not localized |
| seo | component `shared.seo` | |
| sections | dynamiczone | hero, audiences, corridors-marquee, numbers, testimonials, feature-list, process-list, step-cards, insights-strip, form-block, final-cta |

### Blog Post (`api::blog-post.blog-post`) — collection, draft&publish, i18n
| Field | Type | Notes |
|-------|------|-------|
| title | string (req, ≤200) | |
| slug | uid → title (req) | |
| excerpt | text (req, ≤320) | |
| category | enum | 7 categories (Ethical Recruitment … Platform Updates) |
| heroImage | media image (req) | |
| heroAlt | string (req) | |
| readMinutes | integer 1–60 | auto-computed by lifecycle on save |
| author | relation manyToOne → author | |
| tags | relation manyToMany → tag | |
| body | dynamiczone | blocks.{lede,heading,paragraph,list,callout,quote,image,video} |
| seo | component `shared.seo` | |

### Legal Document (`api::legal-document.legal-document`) — collection, draft&publish, i18n
| Field | Type | Notes |
|-------|------|-------|
| slug | enum (req, unique) | privacy / cookies / terms / modern-slavery |
| title, eyebrow, headingHtml, lede | string/text | i18n |
| version | string (req, default 1.0) | |
| lastUpdated | date (req) | |
| controllerName | string | |
| tocAnchors | component[] `blocks.toc-anchor` | |
| body | dynamiczone | heading/paragraph/list/callout/table/quote |
| seo | component `shared.seo` | Website note: the website uses CMS metadata only; legal *body* lives in TSX. |

### Job Posting (`api::job-posting.job-posting`) — collection, draft&publish
Fields: title, slug, description (blocks, req), destinationCountry (enum), destinationCity, sector (enum), salaryMin/Max (decimal), salaryCurrency (enum, default GBP), salaryPeriod (enum), requirements (blocks, req), benefits (blocks), closingDate (date, req), status (enum Draft/Published/Closed/Filled), applicationLink, vacancies (int ≥1), tags (manyToMany → tag), seo. NOTE: the website does not render job postings today (no `/jobs` route).

### Corridor (`api::corridor.corridor`) — collection, draft&publish, i18n
Fields: country (string, req, unique, not localized), displayName (req), sectors (string, req), flagIcon (media), order (int). Consumed by the home marquee via `lib/cms/corridors.ts`.

### Author (`api::author.author`) — collection
Fields: name (req), slug (uid), role, avatar (media), bio (blocks), socialLinks (`shared.social-link`[]), blog_posts (oneToMany → blog-post).

### Tag (`api::tag.tag`) — collection
Fields: name (req, unique), slug (uid), color (hex, default `#F8BD26`), blog_posts (manyToMany), [also targeted by job-posting + candidate].

### Form Definition (`api::form-definition.form-definition`) — collection, i18n
Fields: formKey (enum contact/employers/governments, unique), title, lede, fields (json: array of `{name,label,type,required,options[]?,placeholder?,helpText?}`), submitLabel, successMessage, notifyEmail. Intended to make form copy editable; the website forms are still hard-coded stubs (see [Content flow](./09-content-flow-and-editing.md)).

### Site Settings (`api::site-setting.site-setting`) — single type, i18n
Brand/contact/SEO defaults: name, legalName, tagline, description (≤280), baseUrl, locale, companyNumber, companyAddress (`shared.postal-address`), contactUkPhone/AfricaPhone/Email/LegalEmail/SpeakupEmail, socialLinks (`shared.social-link`[]), communityBaseUrl, logo/favicon/defaultOgImage (media), defaultSeo (`shared.seo`).

### Navigation (`api::navigation.navigation`) — single type, i18n
headerLinks (`shared.nav-link`[]), footerColumns (`shared.footer-column`[]), legalLinks (`shared.nav-link`[]).

### Design Tokens (`api::design-token.design-token`) — single type
brandYellow (hex, req, default `#F8BD26`), color-pair components (text/background/surface/surfaceAlt/accentInk/accentDisplay/line/lineStrong each `tokens.color-pair` light+dark), fontDisplay/fontBody (default "Madimi One"), breakpoints (json), shadowCard/shadowHover. NOTE: the website's tokens live in `app/globals.css` `@theme`; whether these CMS tokens are injected into the site is `TODO/UNVERIFIED` (no token-fetch wiring found in the website's `lib/`).

## 3. PII / restricted entities

### Candidate (`api::candidate.candidate`) — collection, no draft&publish. **Admin-only** (`description`: never exposed on the public API)
| Field | Type | Private? |
|-------|------|----------|
| fullName | string (req) | |
| email | email (req, unique) | **private** |
| phone | string | **private** |
| countryOfOrigin, currentLocation | string | |
| resume | media file | **private** |
| portfolio | media file/image[] | **private** |
| skillTags | manyToMany → tag | |
| sectors | json | |
| yearsExperience | integer 0–60 | |
| languageProficiency | json | |
| applicationStatus | enum (New…Rejected) | |
| assignedAgent | relation → users-permissions.user | **private** |
| notes | blocks | **private** |
| consentMarketing | boolean (default false) | |
| consentDataSharing | boolean (req, default false) | |
| consentTimestamp | datetime | |

### Form Submission (`api::form-submission.form-submission`) — collection. Public can POST; only admins GET/PUT/DELETE
Fields: formKey (enum), payload (json, **private**), audience, firstName/lastName (**private**), email (req, **private**), phone (**private**), organisation, country, message (**private**), ipAddress (**private**), userAgent (**private**), recaptchaScore (decimal, **private**), status (enum New/Acknowledged/InProgress/Closed/Spam), processedAt (**private**). NOTE: the website does not currently POST here (forms are stubs).

## 4. Analytics entities

All three: `draftAndPublish: false`, `content-api.visible: false` (not on the public REST API), `content-manager.visible: true` (admin dashboard reads them).

### Analytics Session (`api::analytics-session`)
sessionId (req, unique, ≤64), firstSeen, lastSeen, pageviewCount, eventCount, entryPath/exitPath (≤512), referrerHost (≤255), utmSource/Medium/Campaign (≤128), country (≤2), region/city (≤128), deviceType (enum mobile/tablet/desktop/bot/unknown), browser/os (≤64), consentLevel (enum), botScore (float), **ipHash (private, ≤64)**, events (oneToMany → analytics-event). Privacy by design: no raw IP — only the salted hash + coarse geo. Purged after `ANALYTICS_RETENTION_MONTHS`.

### Analytics Event (`api::analytics-event`)
type (enum: pageview/click/scroll_depth/section_view/outbound_click/form_start/form_submit/session_end), path (≤512), pageTitle (≤255), referrer (≤512), target (text), sectionId (≤128), scrollDepth (0–100), occurredAt, meta (json), session (manyToOne → analytics-session). No PII. Purged after retention window.

### Analytics Daily Rollup (`api::analytics-daily-rollup`)
date (req, unique), sessions/pageviews/events (int), byPath/byCountry/byDevice/bySection/byReferrer/scrollDepthBuckets (json), consentAnalytics/consentAll (int). Built nightly (02:15 UTC cron); retained longer than raw rows for trend reporting.

## 5. Components (reusable field groups)

- `shared.seo`, `shared.nav-link`, `shared.footer-column`, `shared.postal-address`, `shared.social-link`, `shared.cta`
- `tokens.color-pair` (light/dark)
- `cards.*` (audience-card, feature-item, process-step, stat, step-card, testimonial)
- `sections.*` (hero, audiences, corridors-marquee, feature-list, final-cta, form-block, insights-strip, numbers, process-list, step-cards, testimonials)
- `blocks.*` (lede, heading, paragraph, list, callout, quote, image, video, table, toc-anchor)

## 6. Privacy markings

- `private: true` fields are excluded from API responses by Strapi even for authenticated reads, unless explicitly populated by admin tooling. Marked above for candidate, form-submission, and analytics-session.ipHash.
- The PII boundary is enforced at the **route/role** level: the Public users-permissions role only has `form-submission.create`; `candidate` and `form-submission` reads are admin-only (verified by `scripts/smoke-test.sh` expecting 403).
- Analytics privacy: see [Security & privacy](./14-security-and-privacy.md) and ADR-006.
