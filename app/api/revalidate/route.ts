/**
 * Revalidation webhook target — Strapi POSTs here on every publish.
 *
 * URL: POST /api/revalidate?secret=<REVALIDATE_SECRET>
 * Body: { collection: "blog-post", slug?: "...", uid: "api::blog-post.blog-post" }
 *
 * Verifies the shared secret, then targets both `revalidateTag()`
 * (precise — only affects fetches that opted into the matching tag)
 * and `revalidatePath()` (broad — for routes that don't go through
 * our cached fetcher yet).
 */
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  collection?: string;
  slug?: string;
  uid?: string;
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'forbidden' }, { status: 403 });
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ message: 'invalid json' }, { status: 400 });
  }

  const { collection, slug } = body;

  // Tag invalidation — precise.
  if (collection) {
    revalidateTag(collection);
    if (slug) revalidateTag(`${collection}:${slug}`);
  }

  // Path invalidation — broad.
  switch (collection) {
    case 'blog-post':
      revalidatePath('/');
      if (slug) revalidatePath(`/blog/${slug}`);
      break;
    case 'page':
      if (slug === 'home' || !slug) revalidatePath('/');
      else revalidatePath(`/${slug}`);
      break;
    case 'site-setting':
    case 'design-token':
    case 'navigation':
      revalidatePath('/', 'layout');
      break;
    case 'legal-document':
      if (slug) revalidatePath(`/${slug}`);
      break;
    case 'corridor':
    case 'form-definition':
      revalidatePath('/', 'layout');
      break;
    // Media Library upload / replace / delete. Strapi sends uid
    // `plugin::upload.file`, so `collection` arrives as "file". A file can be
    // referenced from any page, and a replace keeps the same url, so there is
    // nothing narrower to target: refresh the whole layout and every page
    // fetch. Pair with the `?v=<updatedAt>` the media URLs carry, which is
    // what actually defeats next/image's optimised-blob cache.
    case 'file':
      revalidateTag('page');
      revalidateTag('blog-post');
      revalidateTag('site-setting');
      revalidatePath('/', 'layout');
      break;
  }

  return NextResponse.json({ revalidated: true, collection, slug });
}
