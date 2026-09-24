import { Link } from "react-router-dom";
import type { Intensity } from "../api/client";
import { INTENSITY_LABEL, XP_BY_INTENSITY } from "../lib/intensity";

/** The three intensities, in the order they cost. */
const INTENSITIES: Intensity[] = ["chispa", "impulso", "all_out"];

/**
 * What unfolds under a focus when you tap it: the three intensities, and the
 * way out to the full screen.
 *
 * The chips are ephemeral — they only exist while a row is open — so they do
 * not add a permanent box to a card that already learned that lesson.
 */
export function QuickIntensities({
  categoryId,
  focusId,
  busy,
  onPick,
}: {
  categoryId: number;
  focusId: number;
  busy: boolean;
  onPick: (intensity: Intensity) => void;
}) {
  return (
    <div
      className="anim-row mt-2.5"
      style={{ "--delay": "0s" } as React.CSSProperties}
    >
      <div className="flex gap-2">
        {INTENSITIES.map((i) => (
          <button
            key={i}
            type="button"
            disabled={busy}
            onClick={() => onPick(i)}
            className="quick-chip"
          >
            <span className="text-[10px] leading-tight">
              {INTENSITY_LABEL[i]}
            </span>
            <span className="mt-0.5 text-[12px] leading-none">
              +{XP_BY_INTENSITY[i]}
            </span>
          </button>
        ))}
      </div>

      {/* Closing a focus, renaming it and the date live in the menu, not here:
          from a list what you do is log, and an action that changes the focus
          itself should not sit a finger away from the intensities. */}
      <Link
        to={`/log-activity?category=${categoryId}&focus=${focusId}`}
        className="mt-2.5 inline-block text-[9px] font-bold tracking-[0.16em] text-bone/55 underline"
      >
        IR AL MENÚ
      </Link>
    </div>
  );
}
