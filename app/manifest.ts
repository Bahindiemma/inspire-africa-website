import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getSiteSettings } from "@/lib/cms/site-settings";
import { strapiMedia } from "@/lib/cms/media";

// PWA icons are served from the CMS Media Library (no static /public icons).
// If the CMS has no favicon the manifest ships without icons rather than
// referencing a bundled file.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSiteSettings();
  const iconUrl = strapiMedia(s.favicon?.url);
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf7",
    theme_color: "#0a0a0a",
    lang: "en-GB",
    categories: ["business", "education", "government"],
    icons: iconUrl
      ? [
          { src: iconUrl, sizes: "192x192", type: "image/png", purpose: "any" },
          { src: iconUrl, sizes: "512x512", type: "image/png", purpose: "any" },
          { src: iconUrl, sizes: "512x512", type: "image/png", purpose: "maskable" },
        ]
      : [],
  };
}
