/**
 * Resolve a Strapi media URL into something `next/image` can load.
 *
 * Strapi v5 returns the `.url` of an uploaded file as a *relative* path
 * (e.g. `/uploads/hero_abc123.jpg`) whenever the CMS doesn't have an
 * absolute `url` / CDN configured. A bare relative path handed to
 * `next/image` resolves against the *Next.js* origin — not Strapi — so
 * the browser 404s and the image silently never appears. This is the
 * root cause of "I uploaded a new image in Strapi but the site didn't
 * change": the upload populated `photo.url` with `/uploads/...`, which
 * pointed at the wrong host.
 *
 * `strapiMedia()` prefixes relative paths with the public Strapi origin
 * so the URL is absolute and matches `next.config` `remotePatterns`.
 * Absolute URLs (Strapi configured with a CDN/PUBLIC_URL) are returned
 * untouched. The app ships no static image fallbacks.
 *
 * Host precedence:
 *   1. STRAPI_MEDIA_URL  — explicit public media origin (set this in
 *      production to the browser-reachable host that matches
 *      next.config remotePatterns, e.g. http://37.60.225.220:1337).
 *   2. STRAPI_BASE_URL   — the API origin (fine when it's also public).
 */

const MEDIA_ORIGIN = (
  process.env.STRAPI_MEDIA_URL ||
  process.env.STRAPI_BASE_URL ||
  ''
).replace(/\/$/, '');

/*
  WHY THIS THROWS INSTEAD OF DEGRADING.

  On 4 August 2026 this file computed an empty MEDIA_ORIGIN during the CI
  image build, because STRAPI_MEDIA_URL was declared only as a runtime value
  in docker-compose and was never passed as a build argument. The consequences
  were invisible at every step:

    empty origin -> strapiMedia() returns a bare "/uploads/x.jpg"
                 -> next/image rejects a relative /uploads path with 400,
                    because /uploads only exists at the nginx layer
                 -> next/image renders NO element rather than a broken one
                 -> the prerender is silently image-less
                 -> Next caches it with s-maxage=31536000

  The site then served a page with no photographs for thirteen days, and would
  have for a year. Nothing failed. Nothing logged. The build was green.

  A missing media origin is therefore not a degraded state to tolerate — it is
  a broken build, and it must say so before anything is published. This is
  deliberately a hard throw at module load: it fails `next build`, and it
  refuses to start a container that could serve the same silent damage.
*/
if (!MEDIA_ORIGIN) {
  throw new Error(
    'STRAPI_MEDIA_URL (or STRAPI_BASE_URL) is not set. Without it every CMS ' +
      'image renders as nothing and the result gets cached for a year. If this ' +
      'is a Docker build, pass it with --build-arg; see the Dockerfile.',
  );
}

/**
 * @param url Raw `.url` from a Strapi media object (absolute, or a
 *            relative `/uploads/*` path). May be null/undefined.
 * @returns An absolute URL, or null when there's nothing to render.
 */
export function strapiMedia(url: string | null | undefined): string | null {
  if (!url) return null;
  // Already absolute (https://cdn… or http://host…) — leave as-is.
  if (/^https?:\/\//i.test(url)) return url;
  // NOTE: the site no longer ships any static /images/* fallbacks — every
  // visitor-facing image is served from the Strapi Media Library. A bare
  // /images/* path reaching here is stale CMS data; it's treated like any
  // other relative path (prefixed with the media origin), not a local file.
  // Strapi-relative upload path (e.g. "/uploads/foo.jpg") — make absolute.
  if (url.startsWith('/uploads/')) return MEDIA_ORIGIN ? `${MEDIA_ORIGIN}${url}` : url;
  // Anything else relative: best-effort prefix with the media origin.
  if (url.startsWith('/')) return MEDIA_ORIGIN ? `${MEDIA_ORIGIN}${url}` : url;
  return url;
}
