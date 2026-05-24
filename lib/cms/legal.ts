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

export interface LegalDocumentMeta {
  slug: string;
  title: string;
  eyebrow: string;
  headingHtml: string;
  lede: string;
  version: string;
  lastUpdated: string; // ISO date e.g. "2026-05-12"
  controllerName?: string;
}

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
      `/legal-documents?filters[slug][$eq]=${slug}`,
      { revalidate: 300, tags: [`legal-document:${slug}`, 'legal-document'] }
    );
    return data[0] ?? fallback;
  } catch {
    return fallback;
  }
}
