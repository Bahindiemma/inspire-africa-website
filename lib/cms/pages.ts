/**
 * Fetch a single Page document with its Dynamic Zone fully expanded.
 *
 * Strapi v5 requires the verbose `populate[sections][on][component.name][populate]=*`
 * syntax for Dynamic Zones with discriminated unions — this module
 * wraps that once so call sites stay clean.
 */
import { strapiFetch, isStrapiAvailable } from '@/lib/strapi';

export interface CmsPageSection {
  __component: string;
  id?: number;
  [k: string]: any;
}

export interface CmsPage {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    ogImage?: { url: string } | null;
  };
  sections: CmsPageSection[];
  publishedAt?: string;
}

// Per-component populate fragment. Strapi v5 needs each Dynamic Zone
// variant declared explicitly under `populate[sections][on][…]`.
// NB: Strapi v5 does NOT accept the comma shorthand (`populate=photo,ctas`)
// for populating multiple fields of a component — that form errors and the
// fields come back empty (which silently dropped the hero image, falling
// back to photoUrl). Multiple fields must use the object form
// (`populate[photo]=true&populate[ctas]=true`). Single-field populates
// (`populate=stats`) are fine.
const SECTION_POPULATE = [
  'populate[sections][on][sections.hero][populate][photo]=true',
  'populate[sections][on][sections.hero][populate][ctas]=true',
  'populate[sections][on][sections.audiences][populate][cards][populate]=photo',
  'populate[sections][on][sections.corridors-marquee][populate][corridors][populate]=flagIcon',
  'populate[sections][on][sections.numbers][populate]=stats',
  'populate[sections][on][sections.testimonials][populate][items][populate]=photo',
  'populate[sections][on][sections.feature-list][populate]=items',
  'populate[sections][on][sections.process-list][populate]=steps',
  'populate[sections][on][sections.step-cards][populate]=items',
  'populate[sections][on][sections.insights-strip][populate]=filterTag',
  'populate[sections][on][sections.form-block]=true',
  'populate[sections][on][sections.final-cta][populate][primaryCta]=true',
  'populate[sections][on][sections.final-cta][populate][secondaryLinks]=true',
  'populate[seo][populate]=ogImage',
].join('&');

/**
 * Fetch a page by slug from the CMS. Returns `null` when the page
 * doesn't exist (or when Strapi is unreachable and there's no fallback
 * defined). The caller is responsible for the fallback rendering path.
 */
export async function getPage(slug: string): Promise<CmsPage | null> {
  if (!isStrapiAvailable()) return null;
  try {
    const { data } = await strapiFetch<CmsPage[]>(
      `/pages?filters[slug][$eq]=${encodeURIComponent(slug)}&${SECTION_POPULATE}`,
      { revalidate: 60, tags: [`page:${slug}`, 'page'] }
    );
    return data[0] ?? null;
  } catch {
    return null;
  }
}

export async function listPages(): Promise<Pick<CmsPage, 'slug' | 'title'>[]> {
  if (!isStrapiAvailable()) return [];
  try {
    const { data } = await strapiFetch<CmsPage[]>(
      '/pages?fields[0]=slug&fields[1]=title&pagination[pageSize]=100',
      { revalidate: 300, tags: ['page'] }
    );
    return data.map((p) => ({ slug: p.slug, title: p.title }));
  } catch {
    return [];
  }
}
