import { ButtonLink } from "@/components/ui/Button";
import { Brand } from "@/components/ui/Brand";
import { ThemeSwitch } from "@/components/theme/ThemeSwitch";
import { joinUrl } from "@/lib/utm";
import { HeaderScroll } from "./HeaderScroll";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";

export function SiteHeader() {
  return (
    <header className="site-header" id="header">
      <HeaderScroll />
      <div className="container">
        <nav className="nav" aria-label="Primary">
          <Brand />
          <NavLinks />
          <ThemeSwitch />
          <div className="nav-cta">
            <ButtonLink href={joinUrl({ source: "header_nav" })} variant="primary" withArrow>
              Join Community
            </ButtonLink>
          </div>
          <MobileNav />
        </nav>
      </div>
    </header>
  );
}
