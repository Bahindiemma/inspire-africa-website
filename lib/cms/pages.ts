/**
 * Fetch a single Page document with its Dynamic Zone fully expanded.
 *
 * Strapi v5 requires the verbose `populate[sections][on][component.name][populate]=*`
 * syntax for Dynamic Zones with discriminated unions — this module
 * wraps that once so call sites stay clean.
 */
import { strapiFetch, isStrapiAvailable } from '@/lib/strapi';

/** A Strapi media object, as populated under a section (`photo`, `flagIcon`). */
export interface CmsMedia {
  url?: string | null;
  updatedAt?: string | null;
  /** Original filename; photoCredit() reads a credit from it. */
  name?: string | null;
  caption?: string | null;
}

/** The `shared.cta` component. */
export interface CmsCta {
  href?: string | null;
  label?: string | null;
  variant?: 'primary' | 'ghost' | 'dark' | null;
  withArrow?: boolean | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export interface CmsLink {
  href?: string | null;
  label?: string | null;
}

/** Items of `sections.feature-list` and `sections.step-cards`. */
export interface CmsListItem {
  marker?: string | null;
  title?: string | null;
  body?: string | null;
  isBad?: boolean | null;
}

export interface CmsStat {
  value: string;
  label: string;
}

/** Cards of `sections.audiences`. */
export interface CmsAudienceCard {
  id?: number;
  photo?: CmsMedia | null;
  photoAlt?: string | null;
  photoCredit?: string | null;
  tag?: string | null;
  isPrimary?: boolean | null;
  number?: string | null;
  title?: string | null;
  body?: string | null;
  ctaHref?: string | null;
  ctaLabel?: string | null;
}

/** The corridor relation populated on `sections.corridors-marquee`. */
export interface CmsSectionCorridor {
  displayName?: string | null;
  country?: string | null;
  sectors?: string | null;
}

/**
 * One entry of a Page's `sections` Dynamic Zone. Every `sections.*`
 * component shares this flat shape; each field is present only on the
 * components that declare it (see SECTION_POPULATE below and
 * components/cms/DynamicZoneRenderer.tsx).
 */
export interface CmsPageSection {
  __component: string;
  id?: number;
  // shared copy
  eyebrow?: string | null;
  headingHtml?: string | null;
  lede?: string | null;
  tone?: 'default' | 'alt' | 'yellow' | null;
  // sections.hero
  watermark?: string | null;
  centered?: boolean | null;
  className?: string | null;
  photo?: CmsMedia | null;
  photoAlt?: string | null;
  photoCaptionTitle?: string | null;
  photoCaptionSub?: string | null;
  photoCredit?: string | null;
  priority?: boolean | null;
  ctas?: CmsCta[] | null;
  // sections.feature-list, sections.step-cards
  items?: CmsListItem[] | null;
  // sections.process-list
  steps?: CmsListItem[] | null;
  // sections.numbers
  stats?: CmsStat[] | null;
  // sections.final-cta
  primaryCta?: CmsCta | null;
  secondaryLinks?: CmsLink[] | null;
  // sections.form-block
  formKey?: string | null;
  anchorId?: string | null;
  // sections.corridors-marquee
  label?: string | null;
  corridors?: CmsSectionCorridor[] | null;
  // sections.audiences
  cards?: CmsAudienceCard[] | null;
  // sections.insights-strip
  limit?: number | null;
  ctaLabel?: string | null;
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
