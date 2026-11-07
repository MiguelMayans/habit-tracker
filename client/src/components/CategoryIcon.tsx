import type { CSSProperties, ReactNode } from "react";

/** The soft fill under the line: the second tone of the duotone. */
const TINT = { fill: "currentColor", fillOpacity: 0.2, stroke: "none" } as const;

/**
 * One icon per category, as duotone SVG on a 24 grid: a line drawing over a
 * soft fill of the same colour, the way a riso print overlaps two inks.
 *
 * Each one is a little scene with an idea of its own rather than the symbol
 * any app would use: a sneaker mid-stride, a lotus, two hearts, a flag on a
 * summit, a bulb with a spark. The flourish is always kept apart from the
 * main shape, so it does not smudge when small.
 *
 * Drawn here rather than shipped as images: they scale without pixelating,
 * inherit colour through `currentColor`, and add no assets to maintain.
 *
 * The keys are category slugs, which are database values and stay in Spanish.
 */
const STROKES: Record<string, ReactNode> = {
  // Cuerpo → a sneaker mid-stride, with two speed lines behind it.
  cuerpo: (
    <>
      <path
        {...TINT}
        d="M4.5 9.5c1.6.4 3.3.2 4.6-.8l1.4 2.2c2.8 1.6 6.3 1.6 8.8 2.6 1.5.6 2.2 1.6 2.2 2.9v.6H4.2Z"
      />
      <path d="M4.5 9.5c1.6.4 3.3.2 4.6-.8l1.4 2.2c2.8 1.6 6.3 1.6 8.8 2.6 1.5.6 2.2 1.6 2.2 2.9V18H4.2c-.6-2.9-.6-5.7.3-8.5Z" />
      <path d="M4.3 15.4h17.2" />
      <path d="M11.6 11.6l1.2-1.5M13.9 12.3l1.1-1.4" />
      <path d="M1 12.5h1.6M1.6 15.4H3" />
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

  // Disciplina → a flag planted on a summit: getting there step by step.
  disciplina: (
    <>
      <path {...TINT} d="M2.5 20 9 9.5l3.2 4.6 2.3-3L21.5 20Z" />
      <path d="M2.5 20 9 9.5l3.2 4.6 2.3-3L21.5 20Z" />
      <path d="M9 9.5V3" />
      <path {...TINT} fillOpacity={0.45} d="M9 3.2h5.5l-1.4 1.9 1.4 1.9H9Z" />
      <path d="M9 3.2h5.5l-1.4 1.9 1.4 1.9H9" />
      <path d="M7.2 16.2l1.8-1.6 1.6 1.4" />
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
