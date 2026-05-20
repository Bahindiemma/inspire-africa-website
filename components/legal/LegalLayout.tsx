import type { ReactNode } from "react";

export interface LegalToc {
  id: string;
  label: string;
}

interface Props {
  toc: LegalToc[];
  children: ReactNode;
}

export function LegalLayout({ toc, children }: Props) {
  return (
    <section className="legal-section">
      <div className="container">
        <div className="legal-grid">
          <aside className="legal-toc" aria-label="On this page">
            <h4>On this page</h4>
            <ol>
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`}>{t.label}</a>
                </li>
              ))}
            </ol>
          </aside>
          <div className="legal-body">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function LegalHeading({ num, id, children }: { num: string; id: string; children: ReactNode }) {
  return (
    <h2 id={id}>
      <span className="num">{num}</span>
      {children}
    </h2>
  );
}

export function LegalCallout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="legal-callout">
      <strong>{title}</strong>
      {children}
    </div>
  );
}
