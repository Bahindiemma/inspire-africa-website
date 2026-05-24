"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/site";

export interface NavLinkInput {
  href: string;
  label: string;
  /** Renders as the yellow primary nav CTA (e.g. "Join the Community"). */
  cta?: boolean;
}

interface NavLinksProps {
  /**
   * Header nav items. Server component (SiteHeader) passes them in
   * from CMS navigation; falls back to the static NAV_LINKS array
   * if no prop is provided.
   */
  links?: NavLinkInput[];
}

export function NavLinks({ links }: NavLinksProps = {}) {
  const pathname = usePathname();
  const items: NavLinkInput[] = links ?? [...NAV_LINKS];
  return (
    <ul className="nav-links">
      {items.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
        const classes = [link.cta ? "is-cta" : "", isActive ? "active" : ""].filter(Boolean).join(" ");
        return (
          <li key={link.href}>
            <Link href={link.href} className={classes || undefined} aria-current={isActive ? "page" : undefined}>
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
