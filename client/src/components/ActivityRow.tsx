import type { Activity } from "../api/client";
import { isToday, shortRelativeDate } from "../lib/dates";
import { INTENSITY_LABEL, XP_BY_INTENSITY } from "../lib/intensity";
import { useLongPress } from "../lib/useLongPress";

/**
 * A history row, shared between the category detail (the last VISIBLE_HISTORY
 * entries) and the full history. The long press only arms when the activity is
 * from today: the server would refuse to undo anything older, so the gesture
 * is not offered at all — no point opening a dialog that can only end in an
 * error.
 */
export function ActivityRow({
  activity,
  accent,
  focusName,
  delay,
  showDate = true,
  onHold,
}: {
  activity: Activity;
  accent: string;
  /** The focus name, or `null` when the activity had none. */
  focusName: string | null;
  delay: number;
  /** Off where the rows are already grouped under a day heading. */
  showDate?: boolean;
  onHold: () => void;
}) {
  const canUndo = isToday(activity.date);
  const press = useLongPress(onHold);

  return (
    <li
      className={`anim-row relative bg-[#111] py-2.5 pr-3 pl-3.5 ${canUndo ? "long-pressable" : ""}`}
      style={
        {
          borderLeft: `5px solid ${accent}`,
          "--delay": `${delay}s`,
        } as React.CSSProperties
      }
      {...(canUndo ? press : undefined)}
    >
      <div className="flex items-baseline gap-3">
        {/* The description is optional, and most logs have none: a list of
            "Sin descripción" repeated eight times says nothing eight times.
            With no text the row leads with the next most specific thing it
            knows — the focus, set like a focus everywhere else, or failing
            that the intensity. */}
        {activity.description !== "" ? (
          <p className="m-0 flex-1 text-[12px] leading-snug font-semibold text-bone">
            {activity.description}
          </p>
        ) : (
          <p className="m-0 flex-1 truncate font-display text-[12px] leading-snug text-bone uppercase">
            {focusName ?? INTENSITY_LABEL[activity.intensity]}
          </p>
        )}
        {showDate && (
          <span className="shrink-0 text-[9px] font-bold tracking-[0.14em] text-bone/50">
            {shortRelativeDate(activity.date)}
          </span>
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <span
          className="bg-yellow px-1.5 py-0.5 font-display text-[10px] text-black"
          style={{ transform: "skewX(-10deg)" }}
        >
          +{XP_BY_INTENSITY[activity.intensity]} XP
        </span>
        {/* The focus only needs a second line when the description took the
            first one. */}
        {activity.description !== "" && focusName !== null && (
          <span className="text-[9.5px] font-semibold tracking-[0.06em] text-bone/55">
            ↳ {focusName}
          </span>
        )}
      </div>
    </li>
  );
}
