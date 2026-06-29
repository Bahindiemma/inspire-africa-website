import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogPostsPage, formatBlogDate } from "@/lib/cms/blogs";
import { buildMetadata } from "@/lib/seo";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ArrowIcon } from "@/components/ui/ArrowIcon";

const PAGE_SIZE = 6;

export const metadata: Metadata = buildMetadata({
  title: "Blogs",
  description:
    "Insights from the corridor — ethical recruitment, labour-mobility policy and the realities of migration finance, from the INSPIRE AFRICA editorial desk.",
  path: "/blog",
});

interface BlogIndexProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogIndexPage({ searchParams }: BlogIndexProps) {
  const { page } = await searchParams;
  const requested = Math.max(1, parseInt(page ?? "1", 10) || 1);
  // The site ships no static images; hero images come from the CMS and may
  // be null (handled per-card with the neutral placeholder).
  const { posts, page: current, pageCount } = await getBlogPostsPage(requested, PAGE_SIZE);

  const href = (n: number) => (n <= 1 ? "/blog" : `/blog?page=${n}`);

  return (
    <article className="blog-detail">
      <header className="blog-hero">
        <div className="container">
          <div className="blog-hero-inner">
            <Eyebrow>From the field</Eyebrow>
            <h1 className="reveal">Insights from the corridor.</h1>
            <p className="blog-hero-excerpt reveal">
              Field notes on ethical recruitment, labour-mobility policy and migration
              finance — the realities behind governed migration.
            </p>
          </div>
        </div>
      </header>

      <section className="blog-related">
        <div className="container">
          {posts.length > 0 ? (
            <>
              <div className="blog-index-grid">
                {posts.map((p) => (
                  <article className="insight-card" key={p.slug}>
                    <Link
                      href={`/blog/${p.slug}`}
                      className="insight-card-media"
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      {p.heroImage ? (
                        <Image
                          src={p.heroImage}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 33vw"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <span className="insight-card-media-placeholder" aria-hidden="true" />
                      )}
                      <span className="insight-card-tag">{p.category}</span>
                    </Link>
                    <div className="insight-card-body">
                      <div className="insight-card-meta">
                        <time dateTime={p.date}>{formatBlogDate(p.date)}</time>
                        <span aria-hidden>·</span>
                        <span>{p.readMinutes} min read</span>
                      </div>
                      <h3>
                        <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                      </h3>
                      <p>{p.excerpt}</p>
                      <Link href={`/blog/${p.slug}`} className="insight-card-cta">
                        Read the piece
                        <ArrowIcon size={14} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {pageCount > 1 ? (
                <nav className="blog-pagination" aria-label="Blog pages">
                  {current > 1 ? (
                    <Link className="blog-page-link blog-page-arrow" href={href(current - 1)} rel="prev">
                      <ArrowIcon size={14} />
                      <span>Prev</span>
                    </Link>
                  ) : (
                    <span className="blog-page-link blog-page-arrow is-disabled" aria-disabled="true">
                      <ArrowIcon size={14} />
                      <span>Prev</span>
                    </span>
                  )}

                  <ol className="blog-page-numbers">
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                      <li key={n}>
                        {n === current ? (
                          <span className="blog-page-link is-active" aria-current="page">
                            {n}
                          </span>
                        ) : (
                          <Link className="blog-page-link" href={href(n)}>
                            {n}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ol>

                  {current < pageCount ? (
                    <Link className="blog-page-link blog-page-arrow" href={href(current + 1)} rel="next">
                      <span>Next</span>
                      <ArrowIcon size={14} />
                    </Link>
                  ) : (
                    <span className="blog-page-link blog-page-arrow is-disabled" aria-disabled="true">
                      <span>Next</span>
                      <ArrowIcon size={14} />
                    </span>
                  )}
                </nav>
              ) : null}
            </>
          ) : (
            <p className="reveal">No articles yet — check back soon.</p>
          )}
        </div>
      </section>
    </article>
  );
}
