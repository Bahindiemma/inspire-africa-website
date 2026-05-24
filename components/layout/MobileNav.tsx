"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Brand } from "@/components/ui/Brand";
import { NAV_LINKS } from "@/lib/site";
import { joinUrl } from "@/lib/utm";

interface MobileNavLinkInput {
  href: string;
  label: string;
  cta?: boolean;
}

interface MobileNavProps {
  /**
   * Pre-built join URL passed in from the server (SiteHeader) so we
   * don't have to fetch site settings on the client. Falls back to the
   * static joinUrl() if no prop was provided.
   */
  joinHref?: string;
  /** Header nav items from the CMS. Falls back to static NAV_LINKS. */
  links?: MobileNavLinkInput[];
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1={3} y1={6} x2={21} y2={6} />
      <line x1={3} y1={12} x2={21} y2={12} />
      <line x1={3} y1={18} x2={21} y2={18} />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1={18} y1={6} x2={6} y2={18} />
      <line x1={6} y1={6} x2={18} y2={18} />
    </svg>
  );
}

export function MobileNav({ joinHref, links }: MobileNavProps = {}) {
  const resolvedJoinHref = joinHref ?? joinUrl({ source: "mobile_drawer" });
  const navItems = links ?? [...NAV_LINKS];
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape; close on resize past the breakpoint.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onResize() {
      if (window.innerWidth > 1100) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Body scroll-lock + initial focus when opened.
  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    if (open) {
      // Focus the close button after the slide animation starts.
      const id = window.setTimeout(() => closeBtnRef.current?.focus(), 80);
      return () => window.clearTimeout(id);
    }
    // Return focus to the trigger when the drawer closes.
    triggerRef.current?.focus();
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="menu-toggle"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen(true)}
      >
        <HamburgerIcon />
      </button>

      <div
        className={`mobile-drawer-backdrop${open ? " is-open" : ""}`}
        onClick={close}
        aria-hidden
      />

      <aside
        id="mobile-drawer"
        className={`mobile-drawer${open ? " is-open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!open}
        role="dialog"
        aria-modal={open ? true : undefined}
      >
        <div className="mobile-drawer-header">
          <Brand height={36} onClick={close} />
          <button
            ref={closeBtnRef}
            type="button"
            className="mobile-drawer-close"
            aria-label="Close menu"
            onClick={close}
          >
            <CloseIcon />
          </button>
        </div>

        <ul className="mobile-drawer-list">
          {navItems.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={isActive ? "is-active" : undefined}
                  aria-current={isActive ? "page" : undefined}
                  onClick={close}
                  tabIndex={open ? 0 : -1}
                >
                  <span>{link.label}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mobile-drawer-cta">
          <ButtonLink
            href={resolvedJoinHref}
            variant="primary"
            withArrow
            onClick={close}
            tabIndex={open ? 0 : -1}
          >
            Join the Community
          </ButtonLink>
          <p className="mobile-drawer-footnote">Free membership · No card required</p>
        </div>
      </aside>
    </>
  );
}
