/**
 * Attribution overlay pinned to the bottom of a photograph.
 *
 * Renders "Photo By: <name>" with the label in italics. Returns null when
 * there is no credit, so it is safe to drop into any image container
 * unconditionally — see lib/cms/credit.ts for how a credit is resolved.
 *
 * The parent element must be positioned (every image wrapper on the site
 * already is, because next/image `fill` requires it).
 */
interface Props {
  credit: string | null | undefined;
  /** `sm` for card-sized images, where the default would crowd the frame. */
  size?: 'sm' | 'md';
}

export function PhotoCredit({ credit, size = 'md' }: Props) {
  if (!credit) return null;
  return (
    <span className={`photo-credit${size === 'sm' ? ' photo-credit--sm' : ''}`}>
      <em>Photo By:</em> {credit}
    </span>
  );
}
