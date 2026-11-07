import { Link } from "react-router-dom";
import type { Intensity } from "../api/client";
import { INTENSITY_LABEL, XP_BY_INTENSITY } from "../lib/intensity";

/** The three intensities, in the order they cost. */
const INTENSITIES: Intensity[] = ["chispa", "impulso", "all_out"];

/**
 * What unfolds under a focus when you tap it: the three intensities, and the
 * way to the full form. They only exist while a row is open.
 */
export function QuickIntensities({
  categoryId,
  focusId,
  busy,
  onPick,
}: {
  categoryId: number;
  /** Without one (a Lair session) there is no form to go to. */
  focusId?: number;
  busy: boolean;
  onPick: (intensity: Intensity) => void;
}) {
  return (
    <div className="settle pt-1 pb-2">
      <div className="grid grid-cols-3 gap-2">
        {INTENSITIES.map((i) => (
          <button
            key={i}
            type="button"
            disabled={busy}
            onClick={() => onPick(i)}
            className="press grid gap-0.5 rounded-2xl border border-line bg-sand/60 px-2 py-2.5 transition-colors active:bg-mist disabled:opacity-50"
          >
            <span className="text-[14px] font-medium">{INTENSITY_LABEL[i]}</span>
            <span className="text-[12px] text-ink-soft">+{XP_BY_INTENSITY[i]} XP</span>
          </button>
        ))}
      </div>

      {focusId !== undefined && (
        <Link
          to={`/log-activity?category=${categoryId}&focus=${focusId}`}
          className="link-quiet mt-3 inline-block text-[13px]"
        >
          Con nota u otra fecha
        </Link>
      )}
    </div>
  );
}
