import type { Metadata, Viewport } from "next";
import { Madimi_One } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BackToTop } from "@/components/layout/BackToTop";
import { RevealController } from "@/components/layout/RevealController";
import { SITE } from "@/lib/site";
import { organizationJsonLd, websiteJsonLd, SITE_KEYWORDS } from "@/lib/seo";
import { getSiteSettings } from "@/lib/cms/site-settings";

/**
 * Madimi One — the brand typeface. Loaded via three independent paths so
 * the site never falls back to a system font:
 *   1. `next/font/google` — Google Fonts downloaded at build time and
 *      self-hosted under /_next/static/media (primary).
 *   2. Google Fonts CDN <link> in <head> below — runtime fallback if (1)
 *      were ever cleared from the build output.
 *   3. `/public/fonts/MadimiOne-Regular.ttf` + @font-face declaration in
 *      globals.css — ultimate fallback, ships inside the repository.
 */
const madimi = Madimi_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-madimi",
  display: "swap",
  fallback: ["Madimi One", "Madimi One Local", "Impact", "sans-serif"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    metadataBase: new URL(s.baseUrl),
    title: {
      default: `${s.name} — ${s.tagline}`,
      template: `%s — ${s.name}`,
    },
    description: s.description,
    applicationName: s.name,
    generator: "Next.js",
    authors: [{ name: s.legalName }],
    creator: s.legalName,
    publisher: s.legalName,
    keywords: SITE_KEYWORDS,
    category: "business",
    formatDetection: { email: false, address: false, telephone: false },
    alternates: { canonical: s.baseUrl },
    openGraph: {
      type: "website",
      locale: s.locale,
      siteName: s.name,
      title: `${s.name} — ${s.tagline}`,
      description: s.description,
      url: s.baseUrl,
      images: [
        {
          url: "/images/inspire-healthcare-team.jpg",
          width: 1200,
          height: 630,
          alt: `${s.name} — ${s.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${s.name} — ${s.tagline}`,
      description: s.description,
      images: ["/images/inspire-healthcare-team.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

// Inline, blocking script that runs before the first paint. Does two
// things:
//   1. Polyfills MediaQueryList.prototype.addListener/removeListener
//      onto the *prototype* (not just per-instance) so any library —
//      ours, a browser extension, an outdated dev-tool overlay — that
//      still calls the deprecated API gets a working shim. This kills
//      the "Cannot read properties of undefined (reading 'addListener')"
//      class of errors at the root.
//   2. Sets data-theme so the page paints in the right theme on first
//      load (no flash on hydration).
const themeInitScript = `
(function(){
  try{
    if (typeof window !== 'undefined' && typeof window.MediaQueryList !== 'undefined'){
      var P = window.MediaQueryList.prototype;
      if (P && typeof P.addEventListener === 'function' && typeof P.addListener !== 'function'){
        P.addListener = function(fn){ return this.addEventListener('change', fn); };
        P.removeListener = function(fn){ return this.removeEventListener('change', fn); };
      }
    }
  } catch(e){}
  try{
    var t = localStorage.getItem('inspire-theme');
    if (t !== 'light' && t !== 'dark' && t !== 'system') t = 'system';
    var resolved = t;
    if (t === 'system' && window.matchMedia){
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
  } catch(e){
    document.documentElement.setAttribute('data-theme','light');
  }
}())
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning className={madimi.variable}>
      <head>
        {/* Google Fonts CDN — runtime fallback for Madimi One */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Madimi+One&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
      </head>
      {/* suppressHydrationWarning on <body> because browser extensions
          (Grammarly, LanguageTool, etc.) inject attributes like
          `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed`
          onto the body before React hydrates, causing a spurious
          hydration mismatch. This flag tells React to ignore *only*
          attribute/text-content differences on this single element;
          all child component hydration is still validated normally. */}
      <body suppressHydrationWarning>
        <ThemeProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <BackToTop />
          <RevealController />
        </ThemeProvider>
      </body>
    </html>
  );
}
