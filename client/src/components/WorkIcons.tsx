import type { ReactNode } from "react";
import type { WorkKind } from "../api/client";

/** The soft fill under the line: the second tone of the duotone. */
const TINT = { fill: "currentColor", fillOpacity: 0.2, stroke: "none" } as const;

/**
 * The Refuge's kinds, one icon each on a 24 grid, duotone like the category
 * icons — a line drawing over a soft fill of the same colour — and each a
 * small idea rather than a stock symbol. Drawn in code, so they inherit
 * colour and add no assets.
 */
const KIND_STROKES: Record<WorkKind, ReactNode> = {
  // A pad with its d-pad and two buttons.
  game: (
    <>
      <path
        {...TINT}
        d="M7 7.5h10a4.5 4.5 0 0 1 4.4 5.5l-.8 3.8a2.3 2.3 0 0 1-4 1L14.8 16H9.2l-1.8 1.8a2.3 2.3 0 0 1-4-1l-.8-3.8A4.5 4.5 0 0 1 7 7.5Z"
      />
      <path d="M7 7.5h10a4.5 4.5 0 0 1 4.4 5.5l-.8 3.8a2.3 2.3 0 0 1-4 1L14.8 16H9.2l-1.8 1.8a2.3 2.3 0 0 1-4-1l-.8-3.8A4.5 4.5 0 0 1 7 7.5Z" />
      <path d="M8 10.3v3.4M6.3 12h3.4" />
      <circle cx="15.6" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="17.6" cy="13.2" r="1" fill="currentColor" stroke="none" />
      <path d="M10.5 4.5c.6-.9 2.4-.9 3 0" />
    </>
  ),
  // An open book with its ribbon bookmark hanging out.
  book: (
    <>
      <path {...TINT} d="M12 6.4C10 5 7 4.6 3.5 5v13c3.5-.4 6.5 0 8.5 1.5Z" />
      <path d="M12 6.4C10 5 7 4.6 3.5 5v13c3.5-.4 6.5 0 8.5 1.5 2-1.5 5-1.9 8.5-1.5V5C17 4.6 14 5 12 6.4Z" />
      <path d="M12 6.4v13" />
      <path {...TINT} fillOpacity={0.6} d="M15.5 5.2v7l1.6-1.3 1.6 1.3V4.9" />
      <path d="M15.5 5.2v7l1.6-1.3 1.6 1.3V4.9" />
    </>
  ),
  // An old telly with its antenna and a play mark on the screen.
  series: (
    <>
      <rect {...TINT} x="3" y="8" width="18" height="12" rx="2.5" />
      <rect x="3" y="8" width="18" height="12" rx="2.5" />
      <path d="m8.5 3.5 3.5 4.2 3.5-4.2" />
      <path
        d="M10.5 11.4v5.2l4.3-2.6Z"
        fill="currentColor"
        fillOpacity={0.55}
        strokeWidth={1.4}
      />
      <path d="M7 20v1.5M17 20v1.5" />
    </>
  ),
  // A striped bucket of popcorn, overflowing.
  movie: (
    <>
      <path {...TINT} d="M5 9.5h14l-1.6 11H6.6Z" />
      <path d="M5 9.5h14l-1.6 11H6.6Z" />
      <path d="M9.4 9.5 10 20.5M14.6 9.5 14 20.5" />
      <path d="M5.4 9.5a2.2 2.2 0 0 1 1.5-3.6 2.4 2.4 0 0 1 4.2-1.6 2.4 2.4 0 0 1 3.9.4 2.3 2.3 0 0 1 3.6 2.6 1.6 1.6 0 0 1 .4 2.2" />
    </>
  ),
  // A big anime eye with a star in the iris and a glint.
  anime: (
    <>
      <path {...TINT} d="M4.5 11.5C6.5 8.2 9 6.8 12 6.8s5.5 1.4 7.5 4.7c-.7 3.9-3.6 6.7-7.5 6.7s-6.8-2.8-7.5-6.7Z" />
      <path d="M2.8 12.5C5 8 8.2 6 12 6s7 2 9.2 6.5" />
      <path d="M4.8 11.4c.6 4.2 3.5 7.1 7.2 7.1s6.6-2.9 7.2-7.1" />
      <path
        d="m12 9.6.9 1.9 2.1.3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2.1-.3Z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M3.5 6 5.6 7.6M20.5 6l-2.1 1.6M12 2.4v1.8" />
    </>
  ),
  // A "bang" burst, as manga and comics draw them. (The kind is still
  // `comic` in the data; on screen it is "Manga".)
  comic: (
    <>
      <path
        {...TINT}
        d="m12 2.8 1.8 4.4 4.6-1.6-1.8 4.4 4.6 1.6-4.6 1.6 1.8 4.4-4.6-1.6L12 20.4l-1.8-4.4-4.6 1.6 1.8-4.4L2.8 11.6l4.6-1.6-1.8-4.4 4.6 1.6Z"
      />
      <path d="m12 2.8 1.8 4.4 4.6-1.6-1.8 4.4 4.6 1.6-4.6 1.6 1.8 4.4-4.6-1.6L12 20.4l-1.8-4.4-4.6 1.6 1.8-4.4L2.8 11.6l4.6-1.6-1.8-4.4 4.6 1.6Z" />
      <path d="M12 8.6v3.4" />
      <circle cx="12" cy="14.3" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
};

function Svg({
  children,
  className,
  strokeWidth = 1.8,
}: {
  children: ReactNode;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function WorkKindIcon({
  kind,
  className,
}: {
  kind: WorkKind;
  className?: string;
}) {
  return <Svg className={className}>{KIND_STROKES[kind]}</Svg>;
}

/** The Refuge in the nav: a steaming mug — a quiet while of your own. */
export function LairGlyph({ className }: { className?: string }) {
  return (
    <Svg className={className} strokeWidth={1.8}>
      <path d="M4.5 10h12v5.5a4.5 4.5 0 0 1-4.5 4.5H9a4.5 4.5 0 0 1-4.5-4.5Z" />
      <path d="M16.5 11.5h1.2a2.3 2.3 0 0 1 0 4.6h-1.5" />
      <path d="M8.5 3.5c-.8 1 .8 1.8 0 3M12.5 3.5c-.8 1 .8 1.8 0 3" />
    </Svg>
  );
}

/**
 * Home in the nav: a cottage — a chimney with a curl of smoke, a round
 * window and an arched door. A place to come back to, not a "home button".
 */
export function HomeGlyph({ className }: { className?: string }) {
  return (
    <Svg className={className} strokeWidth={1.7}>
      <path d="M3.5 11.2 12 4.5l8.5 6.7" />
      <path d="M5.5 9.7V20h13V9.7" />
      <path d="M15.8 6.5V4h2.2v4.2" />
      <path d="M16.6 2.4c.5-.6 1.5-.6 2 0s1.5.6 2 0" />
      <path d="M10.2 20v-3.4a1.8 1.8 0 0 1 3.6 0V20" />
      <circle cx="12" cy="11.8" r="1.4" />
    </Svg>
  );
}
