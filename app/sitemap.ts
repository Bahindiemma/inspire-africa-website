import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { BLOG_POSTS } from "@/lib/blogs";

const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/approach", priority: 0.9, changeFrequency: "monthly" },
  { path: "/workers", priority: 0.9, changeFrequency: "monthly" },
  { path: "/employers", priority: 0.9, changeFrequency: "monthly" },
  { path: "/governments", priority: 0.9, changeFrequency: "monthly" },
  { path: "/join", priority: 0.85, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/modern-slavery", priority: 0.4, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const staticEntries: MetadataRoute.Sitemap = ROUTES.map((r) => ({
    url: new URL(r.path, SITE.url).toString(),
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((p) => ({
    url: new URL(`/blog/${p.slug}`, SITE.url).toString(),
    lastModified: new Date(p.date + "T00:00:00Z"),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));
  return [...staticEntries, ...blogEntries];
}
