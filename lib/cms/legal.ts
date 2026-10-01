/**
 * Fetch metadata for a legal document by slug.
 *
 * The body of each legal page (huge legal-text JSX) stays in the
 * page file itself — only the title / eyebrow / version /
 * lastUpdated / lede / controller metadata are sourced from the CMS.
 * This keeps the rich, anchor-heavy legal copy reviewable in git
 * while letting non-engineers edit the version + lastUpdated
 * stamps + controller name without a code deploy.
 */
import { strapiFetch, isStrapiAvailable } from '@/lib/strapi';

/** A node of Strapi's Blocks (rich text) AST, as used by `blocks.paragraph`. */
export interface RtNode {
  type?: string;
  /** `ordered` | `unordered` on a `list` node. */
  format?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  url?: string;
  children?: RtNode[];
}

/**
 * One entry of a legal document's `body` dynamic zone — exactly the
 * components LEGAL_POPULATE requests.
 */
export type LegalBlock = { id?: number } & (
  | { __component: 'blocks.lede'; text?: string | null }
  | {
      __component: 'blocks.heading';
      text?: string | null;
      level?: 'h2' | 'h3' | 'h4' | null;
      anchorId?: string | null;
    }
  | { __component: 'blocks.paragraph'; text?: RtNode[] | null }
  | { __component: 'blocks.list'; items?: string[] | null; ordered?: boolean | null }
  | { __component: 'blocks.callout'; title?: string | null; text?: string | null }
  | {
      __component: 'blocks.table';
      caption?: string | null;
      headers?: string[] | null;
      rows?: string[][] | null;
    }
  | { __component: 'blocks.quote'; text?: string | null; attribution?: string | null }
);

export interface LegalTocAnchor {
  label: string;
  anchorId: string;
}

export interface LegalDocumentMeta {
  slug: string;
  title: string;
  eyebrow: string;
  headingHtml: string;
  lede: string;
  version: string;
  lastUpdated: string; // ISO date e.g. "2026-05-12"
  controllerName?: string;
  /** CMS-authored body — a Strapi dynamic zone of `blocks.*` components.
   *  Empty/undefined → the page falls back to its in-repo JSX body. */
  body?: LegalBlock[];
  /** Sticky-TOC entries; empty → the page uses its in-repo TOC. */
  tocAnchors?: LegalTocAnchor[];
}

// Verbose populate for the body dynamic zone + TOC anchors.
const LEGAL_POPULATE = [
  'populate[tocAnchors]=true',
  'populate[body][on][blocks.lede]=true',
  'populate[body][on][blocks.heading]=true',
  'populate[body][on][blocks.paragraph]=true',
  'populate[body][on][blocks.list]=true',
  'populate[body][on][blocks.callout]=true',
  'populate[body][on][blocks.table]=true',
  'populate[body][on][blocks.quote]=true',
].join('&');

const FALLBACKS: Record<string, LegalDocumentMeta> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    eyebrow: 'Legal · Data protection',
    headingHtml: 'Your data — <span class="accent">handled with care.</span>',
    lede: 'This policy explains what personal data INSPIRE AFRICA collects, why we collect it, how we use and share it, and the rights you have over it.',
    version: '2.1',
    lastUpdated: '2026-05-12',
    controllerName: 'Inspire Africa Platform Ltd',
  },
  cookies: {
    slug: 'cookies',
    title: 'Cookie Policy',
    eyebrow: 'Legal · Cookies',
    headingHtml: 'How we use <span class="accent">cookies.</span>',
    lede: 'A plain-English explanation of the cookies and similar technologies we use on inspireafricans.com.',
    version: '1.4',
    lastUpdated: '2026-05-12',
    controllerName: 'Inspire Africa Platform Ltd',
  },
  terms: {
    slug: 'terms',
    title: 'Terms of Use',
    eyebrow: 'Legal · Terms',
    headingHtml: 'Terms of <span class="accent">use.</span>',
    lede: 'The terms that govern your use of the inspireafricans.com website and platform services.',
    version: '1.6',
    lastUpdated: '2026-05-12',
    controllerName: 'Inspire Africa Platform Ltd',
  },
  'modern-slavery': {
    slug: 'modern-slavery',
    title: 'Modern Slavery Statement',
    eyebrow: 'Legal · Compliance',
    headingHtml: 'Modern <span class="accent">slavery statement.</span>',
    lede: "INSPIRE AFRICA's position on modern slavery and human trafficking, and the measures we take to prevent them.",
    version: '1.0',
    lastUpdated: '2026-05-12',
    controllerName: 'Inspire Africa Platform Ltd',
  },
};

/** "2026-05-12" → "12 May 2026" (locale-stable). */
export function formatLegalDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

type LegalSlug = 'privacy' | 'cookies' | 'terms' | 'modern-slavery';

export async function getLegalDocument(slug: LegalSlug): Promise<LegalDocumentMeta> {
  const fallback = FALLBACKS[slug] as LegalDocumentMeta;
  if (!isStrapiAvailable()) return fallback;
  try {
    const { data } = await strapiFetch<LegalDocumentMeta[]>(
      `/legal-documents?filters[slug][$eq]=${slug}&${LEGAL_POPULATE}`,
      { revalidate: 300, tags: [`legal-document:${slug}`, 'legal-document'] }
    );
    return data[0] ?? fallback;
  } catch {
    return fallback;
  }
}
