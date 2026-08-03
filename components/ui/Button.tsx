import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowIcon } from "./ArrowIcon";

type Variant = "primary" | "ghost" | "dark";

interface CommonProps {
  variant?: Variant;
  withArrow?: boolean;
  children: ReactNode;
  className?: string;
}

function classes(variant: Variant, className?: string) {
  return `btn btn--${variant}${className ? ` ${className}` : ""}`;
}

export function ButtonLink({
  href,
  variant = "primary",
  withArrow = false,
  children,
  className,
  prefetch,
  ...rest
}: CommonProps & {
  href: string;
  /**
   * Pass `false` for links whose target has a side effect on render — the
   * /join/start signup gate records a click, and <Link>'s default hover +
   * viewport prefetching would count everyone who merely scrolled past.
   * Ignored for external hrefs, which never prefetch.
   */
  prefetch?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "className">) {
  const external = /^https?:\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
  if (external) {
    return (
      <a
        href={href}
        className={classes(variant, className)}
        rel={href.startsWith("http") ? "noopener" : undefined}
        {...rest}
      >
        {children}
        {withArrow ? <ArrowIcon /> : null}
      </a>
    );
  }
  return (
    <Link href={href} className={classes(variant, className)} prefetch={prefetch} {...rest}>
      {children}
      {withArrow ? <ArrowIcon /> : null}
    </Link>
  );
}

export function Button({
  variant = "primary",
  withArrow = false,
  children,
  className,
  type = "button",
  ...rest
}: CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">) {
  return (
    <button type={type} className={classes(variant, className)} {...rest}>
      {children}
      {withArrow ? <ArrowIcon /> : null}
    </button>
  );
}
