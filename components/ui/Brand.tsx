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
          // Served straight from the Strapi Media Library (small brand
          // chrome) — skip the optimizer so it never depends on a build-time
          // fetch of the CMS origin.
          unoptimized
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
