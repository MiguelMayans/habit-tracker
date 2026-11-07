import type { CSSProperties, ReactNode } from "react";

/** The soft fill under the line: the second tone of the duotone. */
const TINT = { fill: "currentColor", fillOpacity: 0.2, stroke: "none" } as const;

/**
 * One icon per category, as duotone SVG on a 24 grid: a line drawing over a
 * soft fill of the same colour, the way a riso print overlaps two inks.
 *
 * Each one is a little scene with an idea of its own rather than the symbol
 * any app would use: a torso with its six-pack, a lotus, two hearts, the
 * loop that starts over, a bulb with a spark. The flourish is always kept apart from the
 * main shape, so it does not smudge when small.
 *
 * Drawn here rather than shipped as images: they scale without pixelating,
 * inherit colour through `currentColor`, and add no assets to maintain.
 *
 * The keys are category slugs, which are database values and stay in Spanish.
 */
const STROKES: Record<string, ReactNode> = {
  // Cuerpo → a torso in a V, with its six-pack: the body you are building.
  cuerpo: (
    <>
      <path
        {...TINT}
        d="M3.6 4.6C6.4 6 9.2 6.2 12 6.2s5.6-.2 8.4-1.6c-.4 5.6-2.6 10.6-3.9 15.4h-9C6.2 15.2 4 10.2 3.6 4.6Z"
      />
      <path d="M3.6 4.6c.4 5.6 2.6 10.6 3.9 15.4M20.4 4.6c-.4 5.6-2.6 10.6-3.9 15.4" />
      <path d="M9.6 4.6c.6.9 1.4 1.4 2.4 1.4s1.8-.5 2.4-1.4" />
      <path d="M6.6 8.6c1.2 1.3 2.8 1.7 4.3 1.2M17.4 8.6c-1.2 1.3-2.8 1.7-4.3 1.2" />
      <g fill="currentColor" fillOpacity={0.7} stroke="none">
        <rect x="9.2" y="11.2" width="2.4" height="2.2" rx="0.9" />
        <rect x="12.4" y="11.2" width="2.4" height="2.2" rx="0.9" />
        <rect x="9.4" y="14.2" width="2.2" height="2.1" rx="0.9" />
        <rect x="12.4" y="14.2" width="2.2" height="2.1" rx="0.9" />
        <rect x="9.7" y="17.1" width="1.9" height="2" rx="0.9" />
        <rect x="12.4" y="17.1" width="1.9" height="2" rx="0.9" />
      </g>
    </>
  ),

  // Mente → a lotus: presence, open and still.
  mente: (
    <>
      <path {...TINT} d="M12 4.5c2.6 2.4 2.6 7.6 0 11.5-2.6-3.9-2.6-9.1 0-11.5Z" />
      <path d="M12 4.5c2.6 2.4 2.6 7.6 0 11.5-2.6-3.9-2.6-9.1 0-11.5Z" />
      <path d="M12 16c-2.8-.2-5.3-2.3-6-6.2 2.3-.1 4.3.8 5.4 2.4" />
      <path d="M12 16c2.8-.2 5.3-2.3 6-6.2-2.3-.1-4.3.8-5.4 2.4" />
      <path d="M12 16c-3.5 1.6-7 .9-9-1.4M12 16c3.5 1.6 7 .9 9-1.4" />
      <path d="M8 19.5h8" />
    </>
  ),

  // Corazón → two hearts, a small one leaning on the big one: it is about
  // people.
  corazon: (
    <>
      <path
        {...TINT}
        d="M9.5 20.5S3 16.3 3 11.9a3.8 3.8 0 0 1 6.5-2.6 3.8 3.8 0 0 1 6.5 2.6c0 4.4-6.5 8.6-6.5 8.6Z"
      />
      <path d="M9.5 20.5S3 16.3 3 11.9a3.8 3.8 0 0 1 6.5-2.6 3.8 3.8 0 0 1 6.5 2.6c0 4.4-6.5 8.6-6.5 8.6Z" />
      <path
        {...TINT}
        fillOpacity={0.45}
        d="M17.5 11.2s-3.4-2.2-3.4-4.6a2 2 0 0 1 3.4-1.4 2 2 0 0 1 3.4 1.4c0 2.4-3.4 4.6-3.4 4.6Z"
      />
      <path d="M17.5 11.2s-3.4-2.2-3.4-4.6a2 2 0 0 1 3.4-1.4 2 2 0 0 1 3.4 1.4c0 2.4-3.4 4.6-3.4 4.6Z" />
    </>
  ),

  // Disciplina → the loop that starts over every day, with a spark of
  // persistence.
  disciplina: (
    <>
      <path {...TINT} d="M20.4 12.6a8.2 8.2 0 1 1-2.4-5.8l2.6 2.8Z" />
      <path d="M20.4 13a8.2 8.2 0 1 1-2.4-6.2" />
      <path d="M20.6 3.9v5.2h-5.2" />
      <path
        d="M4.4 1.9l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),

  // Ingenio → a bulb that has just lit up, with sparks.
  ingenio: (
    <>
      <path
        {...TINT}
        d="M12 3.8a5.8 5.8 0 0 0-3.4 10.5c.6.5.9 1.2.9 2h5c0-.8.3-1.5.9-2A5.8 5.8 0 0 0 12 3.8Z"
      />
      <path d="M12 3.8a5.8 5.8 0 0 0-3.4 10.5c.6.5.9 1.2.9 2h5c0-.8.3-1.5.9-2A5.8 5.8 0 0 0 12 3.8Z" />
      <path d="M9.6 19h4.8M10.6 21.5h2.8" />
      <path d="M10.4 12.6 12 9.4l1.6 3.2" />
      <path d="M20.3 3.3l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5Z" fill="currentColor" stroke="none" />
      <path d="M3 9.5h1.4M4.1 4.6l1 1" />
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
