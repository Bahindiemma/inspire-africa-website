/**
 * Strapi-backed equivalents of lib/blogs.ts. Same shape (BlogPost type)
 * so existing components keep working unchanged. Falls back to the
 * in-repo BLOG_POSTS array if the CMS is unreachable.
 */
import { strapiFetch, isStrapiAvailable } from '@/lib/strapi';
import { strapiMedia } from '@/lib/cms/media';
import { BLOG_POSTS as STATIC_POSTS, type BlogPost } from '@/lib/blogs';

interface StrapiBlogPost {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  heroAlt: string;
  readMinutes: number;
  publishedAt: string;
  heroImage?: { url: string; alternativeText?: string } | null;
  author?: { name: string; role?: string } | null;
  tags?: Array<{ name: string; slug: string }>;
  body?: any[];
}

function adapt(s: StrapiBlogPost): BlogPost {
  // Hero image is served exclusively from the Strapi Media Library. No
  // static /images/* fallback — if a post has no heroImage uploaded, the
  // renderer shows a neutral placeholder rather than a bundled photo.
  return {
    slug: s.slug,
    title: s.title,
    excerpt: s.excerpt,
    category: s.category,
    author: s.author?.name ?? 'Editorial Desk',
    authorRole: s.author?.role ?? 'INSPIRE AFRICA',
    date: (s.publishedAt ?? '').slice(0, 10),
    readMinutes: s.readMinutes ?? 5,
    heroImage: strapiMedia(s.heroImage?.url),
    heroAlt: s.heroImage?.url ? (s.heroAlt ?? s.title) : s.title,
    tags: (s.tags ?? []).map((t) => t.name),
    // Body conversion: Strapi dynamic-zone blocks → BlogSection shape
    body: (s.body ?? []).map(adaptBlock).filter(Boolean) as any[],
  };
}

function adaptBlock(b: any): any {
  switch (b.__component) {
    case 'blocks.lede':
      return { kind: 'lede', text: b.text };
    case 'blocks.heading':
      return { kind: 'h2', text: b.text };
    case 'blocks.paragraph': {
      // Strapi's blocks editor returns an array of nodes; flatten to plain text.
      const text = Array.isArray(b.text)
        ? b.text
            .map((node: any) => (node.children ?? []).map((c: any) => c.text ?? '').join(''))
            .join('\n\n')
        : String(b.text ?? '');
      return { kind: 'p', text };
    }
    case 'blocks.list':
      return { kind: 'list', ordered: !!b.ordered, items: b.items ?? [] };
    case 'blocks.callout':
      return { kind: 'callout', title: b.title, text: b.text };
    case 'blocks.quote':
      return { kind: 'quote', text: b.text, attribution: b.attribution };
    default:
      return null;
  }
}

const POPULATE_LIST = 'populate[heroImage]=true&populate[tags]=true&populate[author]=true';
const POPULATE_DETAIL =
  'populate[heroImage]=true' +
  '&populate[tags]=true' +
  '&populate[author][populate]=avatar' +
  '&populate[seo][populate]=ogImage' +
  '&populate[body][on][blocks.lede]=true' +
  '&populate[body][on][blocks.heading]=true' +
  '&populate[body][on][blocks.paragraph]=true' +
  '&populate[body][on][blocks.list]=true' +
  '&populate[body][on][blocks.callout]=true' +
  '&populate[body][on][blocks.quote]=true' +
  '&populate[body][on][blocks.image][populate]=image';

export async function getBlogPosts(limit = 10): Promise<BlogPost[]> {
  if (!isStrapiAvailable()) return STATIC_POSTS.slice(0, limit);
  try {
    const { data } = await strapiFetch<StrapiBlogPost[]>(
      `/blog-posts?sort=publishedAt:desc&pagination[pageSize]=${limit}&${POPULATE_LIST}`,
      { revalidate: 60, tags: ['blog-post'] }
    );
    return data.map(adapt);
  } catch {
    return STATIC_POSTS.slice(0, limit);
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  if (!isStrapiAvailable()) return STATIC_POSTS.find((p) => p.slug === slug);
  try {
    const { data } = await strapiFetch<StrapiBlogPost[]>(
      `/blog-posts?filters[slug][$eq]=${encodeURIComponent(slug)}&${POPULATE_DETAIL}`,
      { revalidate: 60, tags: [`blog-post:${slug}`, 'blog-post'] }
    );
    const first = data[0];
    if (!first) return undefined;
    return adapt(first);
  } catch {
    return STATIC_POSTS.find((p) => p.slug === slug);
  }
}

export async function getRelatedPosts(slug: string, limit = 2): Promise<BlogPost[]> {
  const all = await getBlogPosts(20);
  return all.filter((p) => p.slug !== slug).slice(0, limit);
}

// formatBlogDate is re-exported so callers don't import two libs.
export { formatBlogDate } from '@/lib/blogs';
