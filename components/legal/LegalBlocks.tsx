/**
 * Renders a CMS-driven legal-document `body` (a Strapi dynamic zone of
 * blocks) into the same markup the hand-written legal pages used, so a
 * migrated page is visually identical.
 *
 * Two design choices worth knowing:
 *
 *  1. Auto-numbering. The `blocks.heading` component has no "num" field;
 *     instead we count h2-level headings in document order and stamp
 *     "01", "02", … — reproducing the old <LegalHeading num=…> look
 *     without editors having to maintain numbers by hand.
 *
 *  2. Token substitution. Company details (legal name, number, address,
 *     legal email, WhatsApp) used to be interpolated live from the CMS
 *     site-settings. To keep that single source of truth, editors write
 *     {{legalName}}, {{companyNumber}}, {{addressFull}}, {{legalEmail}},
 *     {{whatsapp}} etc. in the legal text and we substitute at render
 *     time. So updating the address in Settings still updates every
 *     legal page automatically.
 */
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { LegalHeading, LegalCallout } from "@/components/legal/LegalLayout";
import type { SiteSettings } from "@/lib/cms/site-settings";

export interface LegalBlock {
  __component: string;
  id?: number;
  [k: string]: any;
}

/** Build the {{token}} → value map from site settings. */
export function legalTokens(s: SiteSettings): Record<string, string> {
  const a = s.companyAddress ?? ({} as SiteSettings["companyAddress"]);
  const addressFull = [a.street, a.city, a.postalCode, a.country].filter(Boolean).join(", ");
  const whatsappDigits = (s.contactAfricaPhone ?? "").replace(/\D+/g, "");
  return {
    legalName: s.legalName ?? "",
    companyNumber: s.companyNumber ?? "",
    addressStreet: a.street ?? "",
    addressCity: a.city ?? "",
    addressPostalCode: a.postalCode ?? "",
    addressCountry: a.country ?? "",
    addressFull,
    email: s.contactEmail ?? "",
    legalEmail: s.contactLegalEmail ?? "",
    speakupEmail: s.contactSpeakupEmail ?? "",
    whatsapp: s.contactAfricaPhone ?? "",
    whatsappDigits,
    whatsappLink: `https://wa.me/${whatsappDigits}`,
  };
}

function substitute(text: string, tokens: Record<string, string>): string {
  if (!text) return "";
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => tokens[key] ?? m);
}

// ---- Strapi Blocks (rich text) inline rendering ----------------------

interface RtNode {
  type?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  url?: string;
  children?: RtNode[];
}

function withLineBreaks(text: string): ReactNode {
  const parts = text.split("\n");
  if (parts.length === 1) return text;
  return parts.map((p, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {p}
    </Fragment>
  ));
}

function renderLeaf(node: RtNode, tokens: Record<string, string>, key: number): ReactNode {
  let el: ReactNode = withLineBreaks(substitute(node.text ?? "", tokens));
  if (node.bold) el = <strong key={`b${key}`}>{el}</strong>;
  if (node.italic) el = <em key={`i${key}`}>{el}</em>;
  if (node.underline) el = <u key={`u${key}`}>{el}</u>;
  return <span key={key}>{el}</span>;
}

function renderInline(children: RtNode[] | undefined, tokens: Record<string, string>): ReactNode[] {
  return (children ?? []).map((c, i) => {
    if (c.type === "link") {
      const href = substitute(c.url ?? "#", tokens);
      const external = /^https?:\/\//i.test(href);
      const inner = renderInline(c.children, tokens);
      if (external || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return (
          <a key={i} href={href} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
            {inner}
          </a>
        );
      }
      return (
        <Link key={i} href={href}>
          {inner}
        </Link>
      );
    }
    return renderLeaf(c, tokens, i);
  });
}

/** Render the Strapi Blocks AST (paragraph block `text` field). */
function renderRichText(nodes: RtNode[] | undefined, tokens: Record<string, string>): ReactNode {
  if (!Array.isArray(nodes)) return null;
  return nodes.map((n, i) => {
    if (n.type === "list") {
      const ordered = (n as any).format === "ordered";
      const Tag = ordered ? "ol" : "ul";
      return (
        <Tag key={i}>
          {(n.children ?? []).map((li, j) => (
            <li key={j}>{renderInline(li.children, tokens)}</li>
          ))}
        </Tag>
      );
    }
    // Default: treat as a paragraph.
    return <p key={i}>{renderInline(n.children, tokens)}</p>;
  });
}

// ---- HTML-string helper (lists / table cells may carry inline <a>/<strong>) ----
function htmlWithTokens(text: string, tokens: Record<string, string>): { __html: string } {
  return { __html: substitute(text ?? "", tokens) };
}

interface Props {
  blocks: LegalBlock[] | undefined | null;
  settings: SiteSettings;
}

export function LegalBlocks({ blocks, settings }: Props) {
  if (!blocks || blocks.length === 0) return null;
  const tokens = legalTokens(settings);
  let h2Count = 0;

  return (
    <>
      {blocks.map((b, i) => {
        switch (b.__component) {
          case "blocks.lede":
            return (
              <p className="lede" key={i}>
                {substitute(b.text ?? "", tokens)}
              </p>
            );

          case "blocks.heading": {
            const level = b.level ?? "h2";
            if (level === "h2") {
              h2Count += 1;
              const num = String(h2Count).padStart(2, "0");
              return (
                <LegalHeading key={i} num={num} id={b.anchorId ?? `section-${h2Count}`}>
                  {substitute(b.text ?? "", tokens)}
                </LegalHeading>
              );
            }
            const Tag = level === "h4" ? "h4" : "h3";
            return (
              <Tag key={i} id={b.anchorId || undefined}>
                {substitute(b.text ?? "", tokens)}
              </Tag>
            );
          }

          case "blocks.paragraph":
            return <Fragment key={i}>{renderRichText(b.text, tokens)}</Fragment>;

          case "blocks.list": {
            const items: string[] = Array.isArray(b.items) ? b.items : [];
            if (b.ordered) {
              return (
                <ol className="legal-list" key={i}>
                  {items.map((it, j) => (
                    <li key={j} dangerouslySetInnerHTML={htmlWithTokens(it, tokens)} />
                  ))}
                </ol>
              );
            }
            return (
              <ul key={i}>
                {items.map((it, j) => (
                  <li key={j} dangerouslySetInnerHTML={htmlWithTokens(it, tokens)} />
                ))}
              </ul>
            );
          }

          case "blocks.callout":
            return (
              <LegalCallout key={i} title={substitute(b.title ?? "", tokens)}>
                <span dangerouslySetInnerHTML={htmlWithTokens(b.text ?? "", tokens)} />
              </LegalCallout>
            );

          case "blocks.table": {
            const headers: string[] = Array.isArray(b.headers) ? b.headers : [];
            const rows: string[][] = Array.isArray(b.rows) ? b.rows : [];
            return (
              <div className="legal-table-wrap" key={i}>
                <table className="legal-table">
                  {b.caption ? <caption>{substitute(b.caption, tokens)}</caption> : null}
                  <thead>
                    <tr>
                      {headers.map((h, j) => (
                        <th key={j} dangerouslySetInnerHTML={htmlWithTokens(h, tokens)} />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td key={k} dangerouslySetInnerHTML={htmlWithTokens(cell, tokens)} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          case "blocks.quote":
            return (
              <blockquote key={i} className="legal-quote">
                <p dangerouslySetInnerHTML={htmlWithTokens(b.text ?? "", tokens)} />
                {b.attribution ? <cite>{substitute(b.attribution, tokens)}</cite> : null}
              </blockquote>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
