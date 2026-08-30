import type { CSSProperties, ReactNode } from "react";

/**
 * Un icono por categoría, en SVG de trazo sobre rejilla de 24. Se usa como
 * marca de agua al fondo de la tarjeta, no como icono de interfaz.
 *
 * Dibujados aquí y no como imágenes: escalan sin pixelarse, heredan el color
 * de la categoría con `currentColor` y no añaden assets que mantener, igual
 * que las texturas.
 */
const TRAZOS: Record<string, ReactNode> = {
  // Cuerpo → mancuerna. Actividad física.
  cuerpo: (
    <>
      <path d="M4 9v6M7 6.5v11M17 6.5v11M20 9v6" />
      <path d="M7 12h10" />
    </>
  ),
  // Mente → ojo. Ocio consciente: presencia, no evasión.
  mente: (
    <>
      <path d="M2 12s3.6-6.2 10-6.2S22 12 22 12s-3.6 6.2-10 6.2S2 12 2 12z" />
      <circle cx="12" cy="12" r="3.1" />
    </>
  ),
  // Corazón → corazón. Relaciones.
  corazon: (
    <path d="M12 20.2S4.6 15.3 4.6 10.4A4.4 4.4 0 0 1 12 7.5a4.4 4.4 0 0 1 7.4 2.9c0 4.9-7.4 9.8-7.4 9.8z" />
  ),
  // Disciplina → flecha que vuelve sobre sí misma. Constancia.
  disciplina: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <path d="M20.5 3.5v5h-5" />
    </>
  ),
  // Ingenio → bombilla. Adquisición activa de competencia.
  ingenio: (
    <>
      <path d="M12 3.2a6.2 6.2 0 0 0-3.6 11.3c.6.5 1 1.3 1 2.1h5.2c0-.8.4-1.6 1-2.1A6.2 6.2 0 0 0 12 3.2z" />
      <path d="M9.6 19.5h4.8M10.6 22h2.8" />
    </>
  ),
};

type Props = {
  slug: string;
  className?: string;
  style?: CSSProperties;
};

export function CategoryIcon({ slug, className, style }: Props) {
  const trazo = TRAZOS[slug];
  if (!trazo) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {trazo}
    </svg>
  );
}
