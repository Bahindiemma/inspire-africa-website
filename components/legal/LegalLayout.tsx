import { Fragment, type ReactNode } from "react";

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

/**
 * Legal headings are force-uppercased in CSS (`.legal-body h2`). That turns
 * acronym plurals like "KPIs" into "KPIS", which reads wrong. This keeps the
 * trailing lowercase letters of an acronym (an uppercase run of 2+ followed by
 * lowercase — "KPIs", "CVs", "NGOs") exempt from the transform, while leaving
 * ordinary words to uppercase as designed. Applied to string children so it
 * covers both the static pages and the CMS-driven LegalBlocks path.
 */
function preserveAcronymCase(text: string): ReactNode {
  const re = /[A-Z]{2,}[a-z]+/g;
  if (!re.test(text)) return text;
  re.lastIndex = 0;
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const upper = m[0].match(/^[A-Z]+/)![0];
    const lower = m[0].slice(upper.length);
    parts.push(upper);
    parts.push(
      <span style={{ textTransform: "none" }}>{lower}</span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((p, i) => <Fragment key={i}>{p}</Fragment>);
}

export function LegalHeading({ num, id, children }: { num: string; id: string; children: ReactNode }) {
  return (
    <h2 id={id}>
      <span className="num">{num}</span>
      {typeof children === "string" ? preserveAcronymCase(children) : children}
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
