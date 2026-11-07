import type { CSSProperties, ReactNode } from "react";

/** The soft fill under the line: the second tone of the duotone. */
const TINT = { fill: "currentColor", fillOpacity: 0.2, stroke: "none" } as const;

/**
 * One icon per category, as duotone SVG on a 24 grid: a line drawing over a
 * soft fill of the same colour, the way a riso print overlaps two inks.
 *
 * Each one is a little scene with an idea of its own rather than the symbol
 * any app would use: a torso with its six-pack, a head with a sunset over
 * still water inside, two people under one umbrella, a cairn of balanced
 * stones, a constellation joining its points. The flourish is always kept apart from the
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

  // Mente → a head in profile, and inside it a sun setting over still
  // water: a mind at rest, present, not scrolling.
  mente: (
    <>
      <path
        {...TINT}
        d="M14.5 21v-2.8h2.2a1.8 1.8 0 0 0 1.8-1.8v-2.2l1.6-.6c.5-.2.6-.8.3-1.2L18.6 10C18.3 5.6 15 3 11 3 6.6 3 3.5 6.3 3.5 10.6c0 2.6 1.1 4.6 2.8 6V21Z"
      />
      <path d="M14.5 21v-2.8h2.2a1.8 1.8 0 0 0 1.8-1.8v-2.2l1.6-.6c.5-.2.6-.8.3-1.2L18.6 10C18.3 5.6 15 3 11 3 6.6 3 3.5 6.3 3.5 10.6c0 2.6 1.1 4.6 2.8 6V21" />
      <path d="M8.2 12a2.8 2.8 0 0 1 5.6 0Z" fill="currentColor" fillOpacity={0.55} />
      <path d="M6.8 14.6c1.1.7 2.1.7 3.2 0s2.1-.7 3.2 0 2.1.7 2.4.3" />
    </>
  ),

  // Corazón → two people under one umbrella: looking after each other.
  corazon: (
    <>
      <path
        {...TINT}
        d="M3 10.5a9 6.5 0 0 1 18 0c-1.1-.9-2.4-.9-3.6 0-1.1-.9-2.3-.9-3.6 0-1.1-.9-2.5-.9-3.6 0-1.1-.9-2.3-.9-3.6 0-1.1-.9-2.4-.9-3.6 0Z"
      />
      <path d="M3 10.5a9 6.5 0 0 1 18 0c-1.1-.9-2.4-.9-3.6 0-1.1-.9-2.3-.9-3.6 0-1.1-.9-2.5-.9-3.6 0-1.1-.9-2.3-.9-3.6 0-1.1-.9-2.4-.9-3.6 0Z" />
      <path d="M12 2.6V4M12 10.5V21" />
      <circle cx="7.6" cy="14" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="16.4" cy="14" r="1.6" fill="currentColor" stroke="none" />
      <path d="M4.8 21a2.8 2.8 0 0 1 5.6 0M13.6 21a2.8 2.8 0 0 1 5.6 0" />
    </>
  ),

  // Disciplina → a cairn, stones stacked in balance: what you build one
  // small, steady day at a time.
  disciplina: (
    <>
      <ellipse {...TINT} fillOpacity={0.3} cx="12" cy="17.6" rx="7.4" ry="2.6" />
      <ellipse cx="12" cy="17.6" rx="7.4" ry="2.6" />
      <ellipse {...TINT} cx="11.4" cy="12.6" rx="5.2" ry="2.2" />
      <ellipse cx="11.4" cy="12.6" rx="5.2" ry="2.2" />
      <ellipse {...TINT} fillOpacity={0.4} cx="12.6" cy="8.4" rx="3.4" ry="1.7" />
      <ellipse cx="12.6" cy="8.4" rx="3.4" ry="1.7" />
      <circle cx="12" cy="4.6" r="1.4" fill="currentColor" stroke="none" />
      <path d="M3 21.2h18" />
    </>
  ),

  // Ingenio → a constellation: separate points, joined into a figure — what
  // learning a skill feels like when it clicks.
  ingenio: (
    <>
      <path d="m4.5 16 5-7.5 5.8 3 4.2-6.5M15.3 11.5l3.6 6.5H11L4.5 16" strokeWidth={1.2} />
      <g {...TINT} fillOpacity={0.3}>
        <circle cx="4.5" cy="16" r="2.6" />
        <circle cx="9.5" cy="8.5" r="2.6" />
        <circle cx="15.3" cy="11.5" r="2.6" />
        <circle cx="19.5" cy="5" r="2.6" />
        <circle cx="18.9" cy="18" r="2.6" />
        <circle cx="11" cy="18" r="2.6" />
      </g>
      <g fill="currentColor" stroke="none">
        <circle cx="4.5" cy="16" r="1.3" />
        <circle cx="9.5" cy="8.5" r="1.5" />
        <circle cx="15.3" cy="11.5" r="1.3" />
        <circle cx="19.5" cy="5" r="1.6" />
        <circle cx="18.9" cy="18" r="1.2" />
        <circle cx="11" cy="18" r="1.2" />
      </g>
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
