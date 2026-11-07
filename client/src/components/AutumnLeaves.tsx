import { useEffect, useState } from "react";
import { season } from "../lib/season";

/** A plain leaf with its midrib, on a 24 grid. */
function Leaf({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
      <path
        d="M12 2.5C6.5 6 4.6 11.6 6.4 17.6c3.2 2.1 8.6 1.2 11.3-3.4 2-3.6.6-8.4-5.7-11.7Z"
        fill={color}
      />
      <path
        d="M7.5 19.5c1.8-4.6 3.4-8.8 4.5-13.6"
        fill="none"
        stroke="rgb(46 42 37 / 0.25)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Where each leaf starts, how big it is, and its own timing and colour. */
const LEAVES = [
  { x: "12%", size: 18, delay: "0.4s", time: "7.5s", color: "var(--color-cuerpo)", sway: "40px" },
  { x: "58%", size: 14, delay: "1.6s", time: "9s", color: "var(--color-disciplina)", sway: "-34px" },
  { x: "82%", size: 20, delay: "0.9s", time: "8.2s", color: "#b5573c", sway: "28px" },
  { x: "36%", size: 12, delay: "2.4s", time: "10s", color: "#d49a4a", sway: "-22px" },
];

/** Once per visit: the home opened again in the same session stays still. */
let fallen = false;

/**
 * Autumn's wink: a few leaves drift down across the screen once, slowly,
 * when the app opens, and are gone. Only in autumn (lib/season.ts), only
 * once per session, and not at all with reduced motion.
 */
export function AutumnLeaves() {
  const [show] = useState(
    () =>
      season() === "autumn" &&
      !fallen &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    fallen = true;
  }, []);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
      {LEAVES.map((l) => (
        <span
          key={l.x}
          className="leaf"
          style={
            {
              left: l.x,
              width: l.size,
              height: l.size,
              "--delay": l.delay,
              "--time": l.time,
              "--sway": l.sway,
            } as React.CSSProperties
          }
        >
          <Leaf color={l.color} />
        </span>
      ))}
    </div>
  );
}
