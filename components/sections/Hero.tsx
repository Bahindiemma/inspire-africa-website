import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

interface HeroProps {
  watermark: string;
  eyebrow: ReactNode;
  heading: ReactNode;
  lede: ReactNode;
  ctas?: ReactNode;
  photo?: {
    src: string | StaticImageData;
    alt: string;
    captionTitle: string;
    captionSub: string;
    priority?: boolean;
  };
  className?: string;
  /** Hide the photo block when the page should use a centered hero (e.g. contact, legal pages) */
  centered?: boolean;
}

export function Hero({ watermark, eyebrow, heading, lede, ctas, photo, className, centered = false }: HeroProps) {
  return (
    <section className={`hero${className ? ` ${className}` : ""}`} data-watermark={watermark}>
      <div className="container">
        {centered || !photo ? (
          <div style={{ maxWidth: 820 }}>
            <span className="eyebrow reveal">{eyebrow}</span>
            <h1 className="reveal" style={{ fontSize: "clamp(48px, 7vw, 96px)", margin: "24px 0 24px" }}>
              {heading}
            </h1>
            <p className="hero-lede reveal" style={{ maxWidth: 680 }}>
              {lede}
            </p>
            {ctas ? <div className="hero-ctas reveal">{ctas}</div> : null}
          </div>
        ) : (
          <div className="hero-grid">
            <div className="hero-text">
              <span className="eyebrow reveal">{eyebrow}</span>
              <h1 className="reveal">{heading}</h1>
              <p className="hero-lede reveal">{lede}</p>
              {ctas ? <div className="hero-ctas reveal">{ctas}</div> : null}
            </div>
            <div className="hero-photo reveal">
              <div className="hero-photo-img">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 960px) 100vw, 40vw"
                  priority={photo.priority ?? true}
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="hero-photo-caption">
                <strong>{photo.captionTitle}</strong>
                <span>{photo.captionSub}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
