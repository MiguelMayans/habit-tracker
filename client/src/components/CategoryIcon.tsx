import type { CSSProperties, ReactNode } from "react";

/** The soft fill under the line: the second tone of the duotone. */
const TINT = { fill: "currentColor", fillOpacity: 0.2, stroke: "none" } as const;

const SOLID = { fill: "currentColor", stroke: "none" } as const;

/**
 * One icon per category, as duotone SVG on a 24 grid: a line drawing over a
 * soft fill of the same colour, with one solid accent — the way a riso print
 * overlaps two inks.
 *
 * Each says what the category is about at 20px, before it is clever: that is
 * the test they are drawn against. It is why the previous, more conceptual
 * set went: a head with a sunset inside read as a bowler hat and a moustache,
 * two people under an umbrella as an umbrella, a constellation as a scribble,
 * and a cairn of ochre stones as something else altogether.
 *
 * Drawn here rather than shipped as images: they scale without pixelating,
 * inherit colour through `currentColor`, and add no assets to maintain.
 *
 * The keys are category slugs, which are database values and stay in Spanish.
 */
const STROKES: Record<string, ReactNode> = {
  // Cuerpo → a torso in a V with its six-pack: the body you are building.
  cuerpo: (
    <>
      <path
        {...TINT}
        d="M3.6 4.6C6.4 6 9.2 6.2 12 6.2s5.6-.2 8.4-1.6c-.4 5.6-2.6 10.6-3.9 15.4h-9C6.2 15.2 4 10.2 3.6 4.6Z"
      />
      <path d="M3.6 4.6c.4 5.6 2.6 10.6 3.9 15.4M20.4 4.6c-.4 5.6-2.6 10.6-3.9 15.4" />
      <path d="M6.6 8.6c1.2 1.3 2.8 1.7 4.3 1.2M17.4 8.6c-1.2 1.3-2.8 1.7-4.3 1.2" />
      <g {...SOLID}>
        <rect x="9" y="11.2" width="2.7" height="2.4" rx="1" />
        <rect x="12.3" y="11.2" width="2.7" height="2.4" rx="1" />
        <rect x="9.3" y="14.4" width="2.4" height="2.3" rx="1" />
        <rect x="12.3" y="14.4" width="2.4" height="2.3" rx="1" />
        <rect x="9.7" y="17.5" width="2" height="2.2" rx="1" />
        <rect x="12.3" y="17.5" width="2" height="2.2" rx="1" />
      </g>
    </>
  ),

  // Mente → a head in profile with a sprout growing inside: a mind you tend.
  mente: (
    <>
      <path
        {...TINT}
        d="M14.5 21.5v-3h2.3a1.9 1.9 0 0 0 1.9-1.9V14l1.7-.6c.5-.2.6-.8.3-1.2L18.8 9.8C18.4 5.2 15 2.5 11 2.5c-4.6 0-7.8 3.5-7.8 8 0 2.7 1.2 4.8 3 6.3v4.7Z"
      />
      <path d="M14.5 21.5v-3h2.3a1.9 1.9 0 0 0 1.9-1.9V14l1.7-.6c.5-.2.6-.8.3-1.2L18.8 9.8C18.4 5.2 15 2.5 11 2.5c-4.6 0-7.8 3.5-7.8 8 0 2.7 1.2 4.8 3 6.3v4.7" />
      <path d="M11 16v-5" />
      <path
        {...SOLID}
        d="M11 11.5c0-2.4-1.7-3.9-4.3-3.9 0 2.5 1.7 3.9 4.3 3.9ZM11 10c0-2.2 1.5-3.7 3.9-3.7 0 2.3-1.5 3.7-3.9 3.7Z"
      />
    </>
  ),

  // Corazón → two people sharing one heart for a body: the ones you love.
  corazon: (
    <>
      <path
        {...TINT}
        d="M12 22s-8.5-4.8-8.5-10.300A4.4 4.4 0 0 1 12 10a4.4 4.4 0 0 1 8.5 1.700C20.5 17.2 12 22 12 22Z"
      />
      <path d="M12 22s-8.5-4.8-8.5-10.300A4.4 4.4 0 0 1 12 10a4.4 4.4 0 0 1 8.5 1.700C20.5 17.2 12 22 12 22Z" />
      <circle {...SOLID} cx="7.8" cy="4.2" r="2.5" />
      <circle {...SOLID} cx="16.2" cy="4.2" r="2.5" />
    </>
  ),

  // Disciplina → the loop that comes round every day, closed with a tick.
  disciplina: (
    <>
      <path {...TINT} d="M12 3.500a8.5 8.5 0 1 0 8.5 8.500Z" />
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <path d="M20.8 2.800V7.600H16" />
      <path d="m8.2 12.3 2.7 2.8 5-5.6" strokeWidth={2.3} />
    </>
  ),

  // Ingenio → a bulb with a spark inside it, the moment something clicks.
  ingenio: (
    <>
      <path
        {...TINT}
        d="M12 2.500a7 7 0 0 0-4.2 12.600c.8.6 1.2 1.5 1.2 2.400h6c0-.9.4-1.8 1.2-2.400A7 7 0 0 0 12 2.500Z"
      />
      <path d="M12 2.500a7 7 0 0 0-4.2 12.600c.8.6 1.2 1.5 1.2 2.400h6c0-.9.4-1.8 1.2-2.400A7 7 0 0 0 12 2.500Z" />
      <path d="M9.5 21h5" />
      <path {...SOLID} d="m12 5.6 1 2.7 2.7 1-2.7 1-1 2.7-1-2.7-2.7-1 2.7-1Z" />
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
  strokeWidth = 1.8,
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
