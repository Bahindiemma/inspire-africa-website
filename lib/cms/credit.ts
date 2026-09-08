/**
 * Photo credits.
 *
 * Every visitor-facing photograph carries an attribution overlay. The credit
 * lives on the media object itself rather than on the section that happens to
 * use it, so a photo keeps its attribution wherever it is placed and an editor
 * sets it once.
 *
 * Resolution order — most specific beats general, and nothing beats a guess:
 *
 *   1. The `Photo Credit` field sitting next to the image in the Content
 *      Manager (`photoCredit` on the hero and audience card, `heroImageCredit`
 *      on a blog post). Per-placement, so the same photo can be credited
 *      differently in two contexts, and it is editable right where the image
 *      is chosen.
 *   2. The file's `caption` in the Media Library. Set once, follows the photo
 *      everywhere it is used — the right place for the usual case.
 *   3. The filename, when it follows the house convention
 *      `First-Last-Source.jpg` (e.g. `Benjamin-Lehman-Unsplash.jpg`), which is
 *      how the photographs are named on upload. This means a correctly named
 *      file is credited the moment it lands, with no second step to forget.
 *   4. Nothing. A photo with no known photographer renders no overlay.
 *
 * The last rule matters: a wrong credit attributes someone's work to the wrong
 * person, which is worse than no credit at all. Never infer a name from a
 * filename that does not clearly carry one.
 */

/** Sources we recognise as the trailing token of a house-convention filename. */
const KNOWN_SOURCES = ['unsplash', 'pexels', 'pixabay', 'freepik', 'shutterstock', 'getty', 'istock'];

export interface CreditableMedia {
  name?: string | null;
  caption?: string | null;
}

/**
 * Turn `Benjamin-Lehman-Unsplash.jpg` into `Benjamin Lehman / Unsplash`.
 * Returns null for anything that isn't clearly a credit — `Picture 1.jpg`,
 * `home-card-workers-construction.jpg`, `PES.png` and friends.
 */
function creditFromFilename(name: string): string | null {
  // Strip the extension, and Strapi's uploaded-name hash suffix if present.
  const base = name.replace(/\.[a-z0-9]+$/i, '').replace(/_[a-f0-9]{10,}$/i, '');
  const parts = base.split(/[-_]+/).filter(Boolean);
  if (parts.length < 3) return null;

  const source = parts[parts.length - 1] ?? '';
  if (!KNOWN_SOURCES.includes(source.toLowerCase())) return null;

  const nameParts = parts.slice(0, -1);
  // A photographer's name, not a slug: every token must be alphabetic, and
  // there must be at least two of them. This is what keeps
  // `home-card-workers-construction.jpg` out.
  if (nameParts.length < 2 || !nameParts.every((p) => /^[A-Za-z']+$/.test(p))) return null;

  const person = nameParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  const src = source.charAt(0).toUpperCase() + source.slice(1).toLowerCase();
  return `${person} / ${src}`;
}

/**
 * The credit line for a Strapi media object, or null when we don't know who
 * took the photograph.
 *
 * @param media    the Strapi file
 * @param override the `Photo Credit` field next to the image in the CMS,
 *                 which wins over everything when an editor has filled it in
 */
export function photoCredit(
  media: CreditableMedia | null | undefined,
  override?: string | null,
): string | null {
  const explicit = override?.trim();
  if (explicit) return explicit;
  if (!media) return null;
  const caption = media.caption?.trim();
  if (caption) return caption;
  if (!media.name) return null;
  return creditFromFilename(media.name);
}
