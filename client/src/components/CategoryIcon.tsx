import type { CSSProperties, ReactNode } from "react";

/**
 * One icon per category, as stroked SVG on a 24 grid.
 *
 * These are not generic interface icons: each one carries a gesture of its own
 * — flames, rays, sparks — so they have character instead of looking pulled
 * from a library. The flourish is always kept apart from the main shape, so it
 * does not smudge at 26px.
 *
 * Drawn here rather than shipped as images: they scale without pixelating,
 * inherit colour through `currentColor`, and add no assets to maintain — the
 * same reasoning as the textures.
 *
 * The keys are category slugs, which are database values and stay in Spanish.
 */
const STROKES: Record<string, ReactNode> = {
  // Cuerpo → a dumbbell lifted on the diagonal, with motion trails.
  cuerpo: (
    <>
      <g transform="rotate(-24 12 12)">
        {/* The plates are filled rather than stroked: a dumbbell drawn with
            lines alone reads as an "H". The mass is what identifies it. */}
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

  // Mente → an eye waking up, with rays coming off the top.
  mente: (
    <>
      <path d="M2.4 13.6s3.7-5.4 9.6-5.4 9.6 5.4 9.6 5.4-3.7 5.4-9.6 5.4S2.4 13.6 2.4 13.6z" />
      <circle cx="12" cy="13.6" r="2.9" />
      <path d="M12 1.9v3.1M5.6 3.4l1.6 2.6M18.4 3.4l-1.6 2.6" />
    </>
  ),

  // Corazón → a burning heart. The flame is the gesture that separates it
  // from any other heart icon.
  corazon: (
    <>
      <path d="M12 21.6s-7.3-4.8-7.3-9.6a4.3 4.3 0 0 1 7.3-2.9 4.3 4.3 0 0 1 7.3 2.9c0 4.8-7.3 9.6-7.3 9.6z" />
      <path d="M12.5 8.3c2.3-2 2.5-4.5.3-7.2.1 2.1-1 3-2.4 3.8-2.1 1.1-2.4 3.4-.5 5.2" />
    </>
  ),

  // Disciplina → the loop that starts over, with a spark of persistence.
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

  // Ingenio → the bulb at the instant it lights, with glints.
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
  /** Stroke width on the 24 grid. The smaller it renders, the thicker. */
  strokeWidth?: number;
};

export function CategoryIcon({
  slug,
  className,
  style,
  strokeWidth = 2.2,
}: Props) {
  const stroke = STROKES[slug];
  if (!stroke) return null;

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
      {stroke}
    </svg>
  );
}
