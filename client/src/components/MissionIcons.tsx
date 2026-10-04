import type { ReactNode } from "react";
import type { MissionKind } from "../lib/missions";

/**
 * The missions' icons, stroked on a 24 grid like the category icons — drawn in
 * code so they inherit colour and add no assets.
 */
function Svg({
  children,
  className,
  strokeWidth = 2.2,
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

/**
 * The missions button on the home: a list whose bullets are the app's
 * diamonds, with the top one ticked.
 */
export function MissionsGlyph({ className }: { className?: string }) {
  return (
    <Svg className={className} strokeWidth={2.4}>
      <path d="m2.8 6.2 1.9 1.9L8.2 4" />
      <path d="M11 6h10.2" />
      <path d="m5.5 10.3 2 2-2 2-2-2Z" fill="currentColor" />
      <path d="M11 12.3h10.2" />
      <path d="m5.5 16.6 2 2-2 2-2-2Z" fill="currentColor" />
      <path d="M11 18.6h7" />
    </Svg>
  );
}
