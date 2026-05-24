/**
 * Typed Strapi v5 REST fetcher for the INSPIRE AFRICA Next.js app.
 *
 * - Wraps `fetch` so every call carries the public API token.
 * - Hooks Next.js's ISR cache via `next.revalidate` and `next.tags`
 *   so the Strapi revalidation webhook can target specific tags.
 * - Throws on non-2xx so call sites can rely on the return value.
 * - Strapi v5 responses are always `{ data, meta }`. We return the
 *   whole envelope so callers can read pagination metadata when they
 *   need it.
 */

export interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiFetchOptions {
  /** Seconds before Next.js's data cache is revalidated. Default 60. Pass 0 for no-cache. */
  revalidate?: number;
  /** Tags Next.js can target with `revalidateTag()` from the webhook handler. */
  tags?: string[];
  /** HTTP method override (defaults to GET). */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Body for POST/PUT (JSON-serialised). */
  body?: unknown;
  /** Extra headers (merged with Authorization + Content-Type). */
  headers?: Record<string, string>;
}

const BASE = process.env.STRAPI_BASE_URL;
const TOKEN = process.env.STRAPI_PUBLIC_TOKEN;

if (typeof window === 'undefined' && !BASE) {
  // Only warn on the server — client doesn't see these envs anyway.
  // We don't throw because lib/site.ts has a static-fallback path so the
  // Next.js app can still render the legacy in-repo content if Strapi is
  // unreachable in a particular environment.
  // eslint-disable-next-line no-console
  console.warn(
    '[lib/strapi] STRAPI_BASE_URL is not set — falling back to static content.'
  );
}

export function isStrapiAvailable(): boolean {
  return Boolean(BASE && TOKEN);
}

export async function strapiFetch<T>(
  path: string,
  options: StrapiFetchOptions = {}
): Promise<StrapiResponse<T>> {
  if (!BASE || !TOKEN) {
    throw new Error(
      'STRAPI_BASE_URL and STRAPI_PUBLIC_TOKEN must be set. Add them to .env.local.'
    );
  }

  const url = `${BASE}/api${path.startsWith('/') ? path : '/' + path}`;
  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    next: {
      revalidate: options.revalidate ?? 60,
      tags: options.tags ?? [],
    },
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Strapi ${res.status} on ${options.method ?? 'GET'} ${path}: ${text.slice(0, 300)}`
    );
  }
  return (await res.json()) as StrapiResponse<T>;
}

/**
 * Build a Strapi-formatted query string from a plain options object.
 * Avoids the manual encoding gymnastics for `populate[on]` etc.
 *
 * Example:
 *   buildQs({ populate: '*', sort: 'order:asc', filters: { country: { $eq: 'UK' } } })
 *   → "populate=*&sort=order%3Aasc&filters%5Bcountry%5D%5B%24eq%5D=UK"
 */
export function buildQs(params: Record<string, any>): string {
  const out: string[] = [];
  const walk = (prefix: string, value: any) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(`${prefix}[${i}]`, v));
    } else if (typeof value === 'object') {
      for (const k of Object.keys(value)) {
        walk(prefix ? `${prefix}[${k}]` : k, value[k]);
      }
    } else {
      out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(value)}`);
    }
  };
  for (const k of Object.keys(params)) walk(k, params[k]);
  return out.join('&');
}
