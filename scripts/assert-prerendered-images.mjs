#!/usr/bin/env node
/**
 * Smoke-test a RUNNING deployment for missing photography.
 *
 * WHAT THIS EXISTS TO CATCH. On 4 August 2026 a green build produced a home
 * page with zero images and Next cached it with `s-maxage=31536000`. The site
 * served no photographs for thirteen days. No test failed, because there was
 * no test — and every check that did exist passed, because the HTML, the CMS
 * and the image files were all individually fine.
 *
 * WHY IT RUNS AGAINST A URL AND NOT THE BUILD. It was written as a post-build
 * step first, and that was wrong: the CMS is unreachable from inside
 * `docker build` (`http://cms:1337` is a Docker-network name), so a build-time
 * prerender of CMS content is *always* empty and the assertion always failed.
 * The only place this question can be answered honestly is against a deployment
 * that can actually reach the CMS.
 *
 *   node scripts/assert-prerendered-images.mjs https://www.inspireafricans.com
 */
const base = (process.argv[2] || process.env.SMOKE_BASE_URL || '').replace(/\/$/, '');

if (!base) {
  console.error('  usage: assert-prerendered-images.mjs <base-url>');
  process.exit(2);
}

// Pages whose purpose includes photography. A legal page having none is
// correct, so the list is explicit rather than "every route".
const PAGES = ['/', '/workers', '/employers', '/governments', '/approach'];

let failed = 0;

for (const path of PAGES) {
  const url = base + path;
  let html;

  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'inspire-smoke/1' } });
    if (!r.ok) { console.error(`  x ${path.padEnd(14)} HTTP ${r.status}`); failed++; continue; }
    html = await r.text();
  } catch (e) {
    console.error(`  x ${path.padEnd(14)} ${e.message}`);
    failed++;
    continue;
  }

  const optimised = (html.match(/_next\/image/g) ?? []).length;
  const tags = (html.match(/<img/g) ?? []).length;

  if (optimised === 0 && tags === 0) {
    console.error(`  x ${path.padEnd(14)} NO images (0 <img>, 0 optimiser refs)`);
    console.error('       next/image renders nothing when it cannot resolve a source.');
    console.error('       Check STRAPI_MEDIA_URL is set at BUILD time, not only at runtime.');
    failed++;
    continue;
  }

  // The specific broken shape: plausible-looking, rejected with 400 at request
  // time because /uploads exists only at the nginx layer.
  if (/["\'(]\/uploads\//.test(html)) {
    console.error(`  x ${path.padEnd(14)} relative /uploads path — MEDIA_ORIGIN was empty when rendered`);
    failed++;
    continue;
  }

  console.log(`  ok ${path.padEnd(14)} ${tags} <img>, ${optimised} optimiser refs`);
}

if (failed) {
  console.error(`\n  ${failed} page(s) are missing their photography.\n`);
  process.exit(1);
}

console.log('\n  all pages carry their media.');
