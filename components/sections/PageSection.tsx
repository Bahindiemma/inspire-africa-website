import type { ReactNode } from "react";

type Tone = "default" | "alt" | "yellow";

const TONE_CLASS: Record<Tone, string> = {
  default: "",
  alt: " page-section--alt",
  yellow: " page-section--yellow",
};

export function PageSection({ children, tone = "default", id }: { children: ReactNode; tone?: Tone; id?: string }) {
  return (
    <section id={id} className={`page-section${TONE_CLASS[tone]}`}>
      <div className="container">{children}</div>
    </section>
  );
}

export function SectionGrid({ children }: { children: ReactNode }) {
  return <div className="section-grid">{children}</div>;
}

export function SectionLeft({
  eyebrow,
  heading,
  children,
}: {
  eyebrow: ReactNode;
  heading: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="section-left">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{heading}</h2>
      {children}
    </div>
  );
}
