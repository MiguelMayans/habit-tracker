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

/** Nombre de la custom property del tema, para usarla en estilos inline. */
const VARS_POR_SLUG: Record<string, string> = {
  cuerpo: "var(--color-cuerpo)",
  disciplina: "var(--color-disciplina)",
  mente: "var(--color-mente)",
  ingenio: "var(--color-ingenio)",
  corazon: "var(--color-corazon)",
};

export function categoryColorClass(slug: string): string {
  return CLASES_POR_SLUG[slug] ?? "bg-hueso/20";
}

export function categoryColorVar(slug: string): string {
  return VARS_POR_SLUG[slug] ?? "var(--color-hueso)";
}
