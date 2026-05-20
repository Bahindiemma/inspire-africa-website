import Image from "next/image";
import Link from "next/link";
import logo from "@/public/inspire-africa-logo.png";

interface BrandProps {
  className?: string;
  /** Render the logo on a dark surface (footer). Inverts the artwork for legibility. */
  onDark?: boolean;
  /** Pixel height of the logo. Width is computed from the natural aspect ratio. */
  height?: number;
  /** Optional click handler — used to close the mobile drawer when the
   *  logo is tapped from inside it. The Link still routes to "/". */
  onClick?: () => void;
}

export function Brand({ className, onDark = false, height = 40, onClick }: BrandProps) {
  const width = Math.round((height * logo.width) / logo.height);
  return (
    <Link
      href="/"
      onClick={onClick}
      className={`brand brand--logo${onDark ? " brand--on-dark" : ""}${className ? ` ${className}` : ""}`}
      aria-label="INSPIRE AFRICA home"
    >
      <Image
        src={logo}
        alt="INSPIRE AFRICA"
        height={height}
        width={width}
        priority
        placeholder="blur"
      />
    </Link>
  );
}
