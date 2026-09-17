/**
 * Tailwind scans the source for literal class names, so a `bg-${slug}` built
 * at runtime would never generate any CSS. Hence the explicit map.
 *
 * The slugs stay in Spanish on purpose: they are values stored in the
 * database, not identifiers we are free to rename.
 */
const VARS_BY_SLUG: Record<string, string> = {
  cuerpo: "var(--color-cuerpo)",
  disciplina: "var(--color-disciplina)",
  mente: "var(--color-mente)",
  ingenio: "var(--color-ingenio)",
  corazon: "var(--color-corazon)",
};

/** The theme custom property name, for use in inline styles. */
export function categoryColorVar(slug: string): string {
  return VARS_BY_SLUG[slug] ?? "var(--color-bone)";
}
