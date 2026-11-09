import type { ReactNode } from "react";
import type { WorkKind } from "../api/client";

/** The soft fill under the line: the second tone of the duotone. */
const TINT = { fill: "currentColor", fillOpacity: 0.2, stroke: "none" } as const;

const SOLID = { fill: "currentColor", stroke: "none" } as const;

/**
 * The Refuge's kinds, one icon each on a 24 grid, duotone like the category
 * icons. They have to say what they are at 20px: anime is a chibi kid with
 * big shining eyes and a cowlick, manga a page of slanted panels with a speech
 * balloon. (An eye with a star in it and a comic "bang", before them, were
 * clever and said nothing; a popcorn bucket read as a bin.)
 */
const KIND_STROKES: Record<WorkKind, ReactNode> = {
  // A pad with its d-pad and two buttons.
  game: (
    <>
      <path
        {...TINT}
        d="M7.5 7h9a5 5 0 0 1 4.9 6l-.8 4a2.5 2.5 0 0 1-4.3 1.2L14.5 16h-5l-1.8 2.2A2.5 2.5 0 0 1 3.4 17l-.8-4a5 5 0 0 1 4.9-6Z"
      />
      <path d="M7.5 7h9a5 5 0 0 1 4.9 6l-.8 4a2.5 2.5 0 0 1-4.3 1.2L14.5 16h-5l-1.8 2.2A2.5 2.5 0 0 1 3.4 17l-.8-4a5 5 0 0 1 4.9-6Z" />
      <path d="M8 9.8v3.8M6.1 11.7h3.8" />
      <circle {...SOLID} cx="15.3" cy="10.3" r="1.2" />
      <circle {...SOLID} cx="17.6" cy="12.8" r="1.2" />
    </>
  ),
  // An open book, with lines of text on its right page.
  book: (
    <>
      <path {...TINT} d="M12 6C10 4.5 6.8 4.2 3 4.7v14.6c3.8-.5 7-.2 9 1.3Z" />
      <path d="M12 6C10 4.5 6.8 4.2 3 4.7v14.6c3.8-.5 7-.2 9 1.3 2-1.5 5.2-1.8 9-1.3V4.700C17.2 4.2 14 4.5 12 6Z" />
      <path d="M12 6v14.6M15 9.300c1.3-.4 2.6-.5 3.5-.5M15 13c1.3-.4 2.6-.5 3.5-.5" />
    </>
  ),
  // An old telly with its antenna and a play mark on the screen.
  series: (
    <>
      <rect {...TINT} x="2.5" y="7" width="19" height="13.5" rx="3" />
      <rect x="2.5" y="7" width="19" height="13.5" rx="3" />
      <path d="m8.5 2.8 3.5 4.2 3.5-4.2" />
      <path
        {...SOLID}
        d="M10 10.5a.6.6 0 0 1 .9-.5l4.6 3.1a.7.7 0 0 1 0 1.2L10.9 17.400a.6.6 0 0 1-.9-.5Z"
      />
    </>
  ),
  // A clapperboard, its stripes cut out of the arm.
  movie: (
    <>
      <path {...TINT} d="M3.5 10.800h17V19a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
      <path d="M3.5 10.800h17V19a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
      <path
        {...SOLID}
        fillRule="evenodd"
        d="m2.6 6.7 16-3.700a1.2 1.2 0 0 1 1.4.9l.9 3.600a.6.6 0 0 1-.4.7L4 11.900a.6.6 0 0 1-.7-.4l-1-4a.6.6 0 0 1 .3-.8ZM7 6.2 9.2 9.400l2.3-.5-2.2-3.200ZM12.3 5l2.2 3.2 2.3-.5-2.2-3.200Z"
      />
    </>
  ),
  // A chibi: round face, a solid fringe with its cowlick, big shining eyes.
  anime: (
    <>
      <path {...TINT} d="M4 13.500a8 8 0 0 0 16 0 8 8 0 0 0-16 0Z" />
      <path d="M4 13.500a8 8 0 0 0 16 0 8 8 0 0 0-16 0Z" />
      <path
        {...SOLID}
        d="M4 13.800C3.5 9 6.8 5.5 12 5.500s8.5 3.5 8 8.300l-2.2-2.9-1.7 1.6-1.5-2.3-1.9 2-1.7-2.2-1.9 2.2-1.5-1.7-1 1.900L6 10.700Z"
      />
      <path {...SOLID} d="M12 5.500c.2-1.8-.6-3-2-3.7 2.4.1 4.1 1.2 4.3 3.9" />
      <path {...SOLID} fillRule="evenodd" d="M6.8 15.7a1.9 2.7 0 1 0 3.8 0a1.9 2.7 0 1 0 -3.8 0ZM8.5 14.7a0.75 0.75 0 1 0 1.5 0a0.75 0.75 0 1 0 -1.5 0ZM13.4 15.7a1.9 2.7 0 1 0 3.8 0a1.9 2.7 0 1 0 -3.8 0ZM15.1 14.7a0.75 0.75 0 1 0 1.5 0a0.75 0.75 0 1 0 -1.5 0Z" />
      <path d="M11.2 19.300c.5.3 1.1.3 1.6 0" strokeWidth={1.3} />
    </>
  ),
  // A manga page: slanted panels, and a speech balloon in the top one. (The
  // kind is still `comic` in the data; on screen it is "Manga".)
  comic: (
    <>
      <rect {...TINT} x="3.5" y="2.5" width="17" height="19" rx="2.2" />
      <rect x="3.5" y="2.5" width="17" height="19" rx="2.2" />
      <path d="M3.5 13.5 20.5 11M11 12.4 9.5 21.5" />
      <path
        {...SOLID}
        d="M12 4.300c2.7 0 4.8 1.2 4.8 2.700S14.7 9.7 12 9.700c-.5 0-1 0-1.4-.1L8 10.800l.8-2C7.8 8.3 7.2 7.7 7.2 7c0-1.5 2.1-2.7 4.8-2.700Z"
      />
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
