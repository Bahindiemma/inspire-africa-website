import { ButtonLink } from "@/components/ui/Button";
import { Brand } from "@/components/ui/Brand";
import { brandLogoFrom } from "@/lib/cms/site-settings";
import { ThemeSwitch } from "@/components/theme/ThemeSwitch";
import { getSiteSettings, getNavigation } from "@/lib/cms/site-settings";
import { buildJoinUrl } from "@/lib/cms/utm";
import { HeaderScroll } from "./HeaderScroll";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";

export async function SiteHeader() {
  const [settings, nav] = await Promise.all([getSiteSettings(), getNavigation()]);
  const headerJoin = buildJoinUrl(settings.communityBaseUrl, { source: "header_nav" });
  const drawerJoin = buildJoinUrl(settings.communityBaseUrl, { source: "mobile_drawer" });
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
            <ButtonLink href={headerJoin} variant="primary" withArrow>
              Join Community
            </ButtonLink>
          </div>
          <MobileNav joinHref={drawerJoin} links={links} logo={logo} />
        </nav>
      </div>
    </header>
  );
}
