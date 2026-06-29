import Image from "next/image";
import Link from "next/link";

/** CMS-resolved logo: absolute Media Library URL + natural dimensions. */
export interface BrandLogo {
  src: string;
  width: number;
  height: number;
  alt?: string;
}

interface BrandProps {
  className?: string;
  /** Render the logo on a dark surface (footer). Inverts the artwork for legibility. */
  onDark?: boolean;
  /** Pixel height of the logo. Width is computed from the natural aspect ratio. */
  height?: number;
  /** Optional click handler — used to close the mobile drawer when the
   *  logo is tapped from inside it. The Link still routes to "/". */
  onClick?: () => void;
  /** Logo from the Strapi Media Library. The site ships NO bundled logo —
   *  when this is absent (CMS unreachable / no logo set) a text wordmark
   *  renders so the header/footer is never blank. */
  logo?: BrandLogo | null;
}

export function Brand({ className, onDark = false, height = 40, onClick, logo }: BrandProps) {
  const hasLogo = !!(logo && logo.src && logo.width && logo.height);
  const width = hasLogo ? Math.round((height * logo!.width) / logo!.height) : 0;
  return (
    <Link
      href="/"
      onClick={onClick}
      className={`brand${hasLogo ? " brand--logo" : ""}${onDark ? " brand--on-dark" : ""}${className ? ` ${className}` : ""}`}
      aria-label="INSPIRE AFRICA home"
    >
      {hasLogo ? (
        <Image
          src={logo!.src}
          alt={logo!.alt ?? "INSPIRE AFRICA"}
          height={height}
          width={width}
          priority
          // Route through the Next image optimizer (NOT unoptimized): the
          // server fetches the CMS image over the internal/http origin and
          // serves it back same-origin over https. Emitting the raw Strapi
          // URL (http://…:1337) on the https site would be blocked as mixed
          // content — which is exactly what broke the badge logo before.
        />
      ) : (
        // Text wordmark fallback — keeps the brand legible with no image.
        <>
          INSPIRE&nbsp;<span className="africa">AFRICA</span>
        </>
      )}
    </Link>
  );
}
