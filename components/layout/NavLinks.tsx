"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/site";

export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="nav-links">
      {NAV_LINKS.map((link) => {
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
