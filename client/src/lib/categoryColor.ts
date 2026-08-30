/**
 * Tailwind escanea el código buscando nombres de clase literales, así que un
 * `bg-${slug}` construido al vuelo no generaría CSS. Por eso el mapa es
 * explícito.
 */
const CLASES_POR_SLUG: Record<string, string> = {
  cuerpo: "bg-cuerpo",
  disciplina: "bg-disciplina",
  mente: "bg-mente",
  ingenio: "bg-ingenio",
  corazon: "bg-corazon",
};

export function categoryColorClass(slug: string): string {
  return CLASES_POR_SLUG[slug] ?? "bg-hueso/20";
}
