#!/usr/bin/env node
/**
 * Assert the join invariant: nobody reaches Mighty Networks except through
 * our own signup page at /join/start.
 *
 * WHAT THIS EXISTS TO CATCH. On 4 September 2026 the CEO reported that "Join
 * the Community" skipped our signup page and dropped visitors straight on
 * `inspire-africa.mn.co/sign_up?...&space_id=20105633`. Every CTA in the
 * codebase was correct. The bad links lived in Strapi: four CMS-authored
 * hero/final CTAs on the home page and /join held a Mighty Networks URL that
 * someone had pasted out of their browser's address bar. No test failed,
 * because no test looked at what the CMS was actually serving.
 *
 * So this runs in TWO modes, and both matter:
 *
 *   node scripts/assert-join-gate.mjs
 *       Source scan (offline). Fails if any file under app/ components/ lib/
 *       mentions the community host, except the one route allowed to.
 *       Wired to `prebuild`, so a bad link cannot be committed and shipped.
 *
 *   node scripts/assert-join-gate.mjs https://www.inspireafricans.com
 *       Deployment scan. Fetches the real pages and fails on any rendered
 *       href to the community host. This is the mode that would have caught
 *       the September incident, because the fault was in data, not in code.
 *       Same lesson as assert-prerendered-images.mjs: some questions can only
 *       be answered honestly against a deployment that can reach the CMS.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, not URL.pathname: the repo path contains spaces, and a raw
// pathname keeps them percent-encoded.
const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Matches the community host in source text or in rendered HTML. */
const COMMUNITY = /mn\.co|mightynetworks\.com/i;

/**
 * The handoff route is the one place a visitor may legitimately be sent to
 * Mighty Networks, and the two builders + the base URL constant it calls.
 * Everything else must go through buildJoinGateUrl()/normalizeJoinHref().
 */
const SOURCE_ALLOWLIST = new Set([
  'app/join/continue/route.ts',
  'lib/utm.ts',
  'lib/cms/utm.ts',
  'lib/site.ts',
]);

const SCAN_DIRS = ['app', 'components', 'lib'];
const SCAN_EXT = /\.(tsx?|jsx?|mjs)$/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXT.test(entry)) out.push(full);
  }
  return out;
}

function scanSource() {
  const offenders = [];
  for (const dir of SCAN_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      const rel = relative(ROOT, file);
      if (SOURCE_ALLOWLIST.has(rel)) continue;
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        // Ignore prose in comments — this file's own docs mention the host.
        const code = line.replace(/^\s*(\/\/|\*|\/\*).*$/, '');
        if (COMMUNITY.test(code)) offenders.push(`${rel}:${i + 1}  ${line.trim()}`);
      });
    }
  }
  if (offenders.length) {
    console.error('\n  x community links found in source:\n');
    for (const o of offenders) console.error(`      ${o}`);
    console.error('\n  Every join CTA must call buildJoinGateUrl() or pass through');
    console.error('  normalizeJoinHref()/normalizeJoinCtaHref() in lib/utm.ts.');
    console.error('  Only app/join/continue/route.ts may send a visitor to the community.\n');
    process.exit(1);
  }
  console.log(`  ok source scan  no community links outside ${[...SOURCE_ALLOWLIST].join(', ')}`);
}

/** Pages that carry join CTAs. A leak on any one of them breaks the funnel. */
const PAGES = [
  '/',
  '/join',
  '/approach',
  '/workers',
  '/employers',
  '/governments',
  '/contact',
  '/blog',
];

async function scanDeployment(base) {
  let failed = 0;

  for (const path of PAGES) {
    let html;
    try {
      const r = await fetch(base + path, { headers: { 'User-Agent': 'inspire-join-gate/1' } });
      if (!r.ok) { console.error(`  x ${path.padEnd(14)} HTTP ${r.status}`); failed++; continue; }
      html = await r.text();
    } catch (e) {
      console.error(`  x ${path.padEnd(14)} ${e.message}`);
      failed++;
      continue;
    }

    // Only hrefs matter. Body copy naming Mighty Networks (the legal pages do)
    // is correct and must not fail the check.
    const leaks = [...html.matchAll(/href="([^"]*)"/g)]
      .map((m) => m[1])
      .filter((h) => COMMUNITY.test(h));

    if (leaks.length) {
      console.error(`  x ${path.padEnd(14)} ${leaks.length} link(s) skip the signup page:`);
      for (const l of [...new Set(leaks)]) console.error(`       ${l}`);
      failed++;
      continue;
    }

    const gate = (html.match(/href="\/join\/start/g) ?? []).length;
    console.log(`  ok ${path.padEnd(14)} 0 community links, ${gate} gate link(s)`);
  }

  if (failed) {
    console.error(`\n  ${failed} page(s) send visitors to the community without signing up.`);
    console.error('  If the source scan passes, the bad href is CMS data — fix it in Strapi.\n');
    process.exit(1);
  }
  console.log('\n  every join route passes through /join/start.');
}

const base = (process.argv[2] || process.env.SMOKE_BASE_URL || '').replace(/\/$/, '');
scanSource();
if (base) await scanDeployment(base);
