import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * A literal Mighty Networks URL anywhere in a component is the bug the CEO
 * reported on 2026-09-04: a "Join the Community" button that skipped our own
 * signup page. The community is reached from exactly one place —
 * app/join/continue/route.ts — and every CTA points at /join/start instead.
 * scripts/assert-join-gate.mjs enforces the same rule at build and against a
 * live deployment; this catches it while you type.
 */
const noCommunityLinks = {
  selector: "Literal[value=/mn\\.co|mightynetworks\\.com/i]",
  message:
    'Do not link to Mighty Networks directly. Use buildJoinGateUrl() from lib/utm.ts, ' +
    'or normalizeJoinHref()/normalizeJoinCtaHref() for CMS-authored hrefs. Only ' +
    'app/join/continue/route.ts may send a visitor to the community.',
};

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      'no-restricted-syntax': ['error', noCommunityLinks],
    },
  },
  {
    // The handoff route and the URL builders it calls are the exception.
    files: ['app/join/continue/route.ts', 'lib/utm.ts', 'lib/cms/utm.ts', 'lib/site.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
];

export default eslintConfig;
