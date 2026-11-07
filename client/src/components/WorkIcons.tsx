import type { ReactNode } from "react";
import type { WorkKind } from "../api/client";

/**
 * The Lair's icons, stroked on a 24 grid like the category and mission icons:
 * drawn in code, so they inherit colour and add no assets.
 */
const KIND_STROKES: Record<WorkKind, ReactNode> = {
  // A pad: the grips, a cross and two buttons.
  game: (
    <>
      <path d="M7 7h10a4.5 4.5 0 0 1 4.4 5.4l-.9 4.4a2.3 2.3 0 0 1-4 1L14.6 16H9.4l-1.9 1.8a2.3 2.3 0 0 1-4-1l-.9-4.4A4.5 4.5 0 0 1 7 7Z" />
      <path d="M8 10v4M6 12h4" />
      <circle cx="15.5" cy="11" r=".6" fill="currentColor" />
      <circle cx="17.2" cy="13" r=".6" fill="currentColor" />
    </>
  ),
  // An open book, the spine down the middle.
  book: (
    <>
      <path d="M12 6.5C10 5 7 4.6 3.5 5v13c3.5-.4 6.5 0 8.5 1.5 2-1.5 5-1.9 8.5-1.5V5C17 4.6 14 5 12 6.5Z" />
      <path d="M12 6.5v13" />
    </>
  ),
  // An old set with its antenna: series are what you watch on the telly.
  series: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="1.5" />
      <path d="m8.5 3.5 3.5 4 3.5-4" />
      <path d="M17.5 11.5v5" />
    </>
  ),
  // A clapperboard.
  movie: (
    <>
      <path d="M3.5 10h17v10h-17Z" />
      <path d="m3.2 10-.6-3.6 16.2-2.8.6 3.6Z" />
      <path d="m7.2 5.6 2.3 2.9M11.6 4.9l2.3 2.8" />
    </>
  ),
  // A big anime eye, with the star in it.
  anime: (
    <>
      <path d="M2.5 12.5C5 8 8.3 6 12 6s7 2 9.5 6.5" />
      <path d="M5 11c.4 4 3.3 7 7 7s6.6-3 7-7" />
      <path d="m12.6 9.6.7 1.5 1.6.2-1.2 1.1.3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1.1 1.6-.2Z" fill="currentColor" />
      <path d="M4 5.5 6.5 7M20 5.5 17.5 7" />
    </>
  ),
  // A spiky comic balloon with a bang.
  comic: (
    <>
      <path d="M4 5.5h16v10.5h-8.5l-5 4 1-4H4Z" />
      <path d="M12 8v3.8" />
      <circle cx="12" cy="13.8" r=".5" fill="currentColor" />
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
