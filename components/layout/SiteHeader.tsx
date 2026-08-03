import { ButtonLink } from "@/components/ui/Button";
import { Brand } from "@/components/ui/Brand";
import { brandLogoFrom } from "@/lib/cms/site-settings";
import { ThemeSwitch } from "@/components/theme/ThemeSwitch";
import { getSiteSettings, getNavigation } from "@/lib/cms/site-settings";
import { buildJoinGateUrl } from "@/lib/utm";
import { HeaderScroll } from "./HeaderScroll";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";

export async function SiteHeader() {
  const [settings, nav] = await Promise.all([getSiteSettings(), getNavigation()]);
  // Both CTAs now go through the internal signup gate, which records the
  // click server-side and then performs the Mighty Networks handoff.
  const headerJoin = buildJoinGateUrl({ source: "header_nav" });
  const drawerJoin = buildJoinGateUrl({ source: "mobile_drawer" });
  const logo = brandLogoFrom(settings);
  // Sort by `order` and map to the NavLink shape NavLinks + MobileNav expect.
  const links = (nav.headerLinks ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((l) => ({ href: l.href, label: l.label, cta: !!l.isCta }));
  return (
    <header className="site-header" id="header">
      <HeaderScroll />
      <div className="container">
        <nav className="nav" aria-label="Primary">
          <Brand logo={logo} />
          <NavLinks links={links} />
          <ThemeSwitch />
          <div className="nav-cta">
            <ButtonLink href={headerJoin} variant="primary" withArrow prefetch={false}>
              Join Community
            </ButtonLink>
          </div>
          <MobileNav joinHref={drawerJoin} links={links} logo={logo} />
        </nav>
      </div>
    </header>
  );
}
