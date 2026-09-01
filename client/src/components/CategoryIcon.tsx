import type { CSSProperties, ReactNode } from "react";

/**
 * Un icono por categoría, en SVG de trazo sobre rejilla de 24.
 *
 * No son iconos de interfaz genéricos: cada uno lleva un gesto propio —
 * llamas, rayos, chispas— para que tengan carácter en vez de parecer sacados
 * de una librería. El adorno va siempre separado de la forma principal, para
 * que a 26px no se emborrone.
 *
 * Dibujados aquí y no como imágenes: escalan sin pixelarse, heredan el color
 * con `currentColor` y no añaden assets que mantener, igual que las texturas.
 */
const TRAZOS: Record<string, ReactNode> = {
  // Cuerpo → mancuerna levantada en diagonal, con estelas de movimiento.
  cuerpo: (
    <>
      <g transform="rotate(-24 12 12)">
        {/* Los discos van rellenos y no a trazo: una mancuerna dibujada solo
            con líneas se lee como una "H". La masa es lo que la identifica. */}
        <rect
          x="5.2"
          y="6.6"
          width="3.8"
          height="10.8"
          rx="1.6"
          fill="currentColor"
          stroke="none"
        />
        <rect
          x="15"
          y="6.6"
          width="3.8"
          height="10.8"
          rx="1.6"
          fill="currentColor"
          stroke="none"
        />
        <path d="M9 12h6" />
      </g>
      <path d="M2.4 5.4l3.2-1.3M3.2 9l2.6-1" />
    </>
  ),

  // Mente → ojo que despierta, con rayos saliendo hacia arriba.
  mente: (
    <>
      <path d="M2.4 13.6s3.7-5.4 9.6-5.4 9.6 5.4 9.6 5.4-3.7 5.4-9.6 5.4S2.4 13.6 2.4 13.6z" />
      <circle cx="12" cy="13.6" r="2.9" />
      <path d="M12 1.9v3.1M5.6 3.4l1.6 2.6M18.4 3.4l-1.6 2.6" />
    </>
  ),

  // Corazón → corazón ardiendo. La llama es el gesto que lo separa de un
  // corazón de icono cualquiera.
  corazon: (
    <>
      <path d="M12 21.6s-7.3-4.8-7.3-9.6a4.3 4.3 0 0 1 7.3-2.9 4.3 4.3 0 0 1 7.3 2.9c0 4.8-7.3 9.6-7.3 9.6z" />
      <path d="M12.5 8.3c2.3-2 2.5-4.5.3-7.2.1 2.1-1 3-2.4 3.8-2.1 1.1-2.4 3.4-.5 5.2" />
    </>
  ),

  // Disciplina → el bucle que vuelve a empezar, con una chispa de constancia.
  disciplina: (
    <>
      <path d="M20.8 13a8.4 8.4 0 1 1-2.5-6" />
      <path d="M21 3.9v5.2h-5.2" />
      <path
        d="M4.2 1.9l1 2.3 2.3 1-2.3 1-1 2.3-1-2.3-2.3-1 2.3-1z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),

  // Ingenio → la bombilla en el instante de encenderse, con destellos.
  ingenio: (
    <>
      <path d="M12 3.6a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3.6z" />
      <path d="M9.5 19.5h5M10.6 21.9h2.8" />
      <path d="M12 .8v1.7M21.3 7.9l-2.3.8M2.7 7.9l2.3.8" />
    </>
  ),
};

type Props = {
  slug: string;
  className?: string;
  style?: CSSProperties;
  /** Grosor sobre la rejilla de 24. Cuanto más pequeño se pinte, más grueso. */
  strokeWidth?: number;
};

export function CategoryIcon({
  slug,
  className,
  style,
  strokeWidth = 2.2,
}: Props) {
  const trazo = TRAZOS[slug];
  if (!trazo) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
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
