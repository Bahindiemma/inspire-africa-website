import Link from "next/link";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="hero" data-watermark="404">
      <div className="container" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <Eyebrow>404</Eyebrow>
        <h1 style={{ margin: "24px auto", maxWidth: 720 }}>
          <span className="small-italic">We couldn&apos;t find that page —</span>
          <span className="accent">but the rest is right here.</span>
        </h1>
        <p className="hero-lede" style={{ margin: "0 auto 28px", maxWidth: 540 }}>
          The page you were looking for may have moved or never existed. Head back home or explore the platform.
        </p>
        <div className="hero-ctas" style={{ justifyContent: "center" }}>
          <ButtonLink href="/" variant="primary" withArrow>
            Back home
          </ButtonLink>
          <Link href="/contact" className="btn btn--ghost">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
