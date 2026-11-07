import type { ReactNode } from "react";
import type { MissionKind } from "../lib/missions";

/**
 * The missions' icons, stroked on a 24 grid like the category icons — drawn in
 * code so they inherit colour and add no assets.
 */
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

const KIND_STROKES: Record<MissionKind, ReactNode> = {
  // An old handset, tilted, with two ring lines.
  call: (
    <>
      <path d="M6.5 3.8 9.4 4.6l1 4.1-2.1 1.5a11 11 0 0 0 5.5 5.5l1.5-2.1 4.1 1 .8 2.9c.2.8-.4 1.6-1.2 1.7C11.4 20 4 12.6 4.8 5c.1-.8.9-1.4 1.7-1.2Z" />
      <path d="M15 3.6a5.6 5.6 0 0 1 5.4 5.4" />
      <path d="M14.6 7a2.4 2.4 0 0 1 2.4 2.4" />
    </>
  ),
  // A form with a stamp in the corner.
  paperwork: (
    <>
      <path d="M6 3h8.5L18 6.5V21H6Z" />
      <path d="M9 9h6M9 12.5h6M9 16h3" />
      <path d="M14.5 3v3.5H18" />
    </>
  ),
  // A shopping bag.
  shopping: (
    <>
      <path d="M5 8h14l-1.2 12.5H6.2Z" />
      <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" />
    </>
  ),
};

export function MissionKindIcon({
  kind,
  className,
}: {
  kind: MissionKind;
  className?: string;
}) {
  return <Svg className={className}>{KIND_STROKES[kind]}</Svg>;
}

/** The missions in the nav: a list with the top item ticked. */
export function MissionsGlyph({ className }: { className?: string }) {
  return (
    <Svg className={className} strokeWidth={1.8}>
      <path d="m3.5 6.5 1.6 1.6 3-3.2" />
      <path d="M11 7h9.5M11 12h9.5M11 17h9.5" />
      <circle cx="5.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="17" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** The missions' sections, each with its own little drawing. */
export function SectionGlyph({
  group,
  className,
}: {
  group: "overdue" | "today" | "upcoming" | "someday";
  className?: string;
}) {
  const strokes: Record<typeof group, ReactNode> = {
    // An hourglass, its sand run through.
    overdue: (
      <>
        <path d="M6.5 3.5h11M6.5 20.5h11" />
        <path d="M7.5 3.5c0 4.2 4.5 5.4 4.5 8.5s-4.5 4.3-4.5 8.5M16.5 3.5c0 4.2-4.5 5.4-4.5 8.5s4.5 4.3 4.5 8.5" />
        <path d="M9.2 19.5c.8-1.6 1.8-2.4 2.8-2.4s2 .8 2.8 2.4Z" fill="currentColor" fillOpacity={0.5} stroke="none" />
      </>
    ),
    // A sun.
    today: (
      <>
        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity={0.25} />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
      </>
    ),
    // A calendar page, with the day ahead marked.
    upcoming: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
        <path d="M3.5 9.5h17M8 3v4M16 3v4" />
        <circle cx="15.5" cy="15" r="1.8" fill="currentColor" stroke="none" />
      </>
    ),
    // A cloud: someday, whenever.
    someday: (
      <path
        d="M7 18.5a4 4 0 0 1-.6-8 5.5 5.5 0 0 1 10.6-1.3A4.6 4.6 0 0 1 17 18.5Z"
        fill="currentColor"
        fillOpacity={0.2}
      />
    ),
  };
  return (
    <Svg className={className} strokeWidth={1.8}>
      {strokes[group]}
      {group === "someday" && (
        <path d="M7 18.5a4 4 0 0 1-.6-8 5.5 5.5 0 0 1 10.6-1.3A4.6 4.6 0 0 1 17 18.5Z" />
      )}
    </Svg>
  );
}
