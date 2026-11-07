import type { Activity } from "../api/client";
import { isToday, shortRelativeDate } from "../lib/dates";
import { INTENSITY_LABEL, XP_BY_INTENSITY } from "../lib/intensity";
import { useLongPress } from "../lib/useLongPress";

/**
 * A history row, shared between the category detail and the full history.
 * The long press only arms for an activity from today: the server would
 * refuse to undo anything older, so the gesture is not offered at all.
 */
export function ActivityRow({
  activity,
  focusName,
  showDate = true,
  onHold,
}: {
  activity: Activity;
  /** The focus name, or `null` when the activity had none. */
  focusName: string | null;
  /** Off where the rows are already grouped under a day heading. */
  showDate?: boolean;
  onHold: () => void;
}) {
  const canUndo = isToday(activity.date);
  const press = useLongPress(onHold);

  // The description is optional and most logs have none: without it the row
  // leads with the focus, or failing that the intensity.
  const title =
    activity.description !== ""
      ? activity.description
      : (focusName ?? INTENSITY_LABEL[activity.intensity]);
  const detail = [
    activity.description !== "" ? focusName : null,
    INTENSITY_LABEL[activity.intensity],
    showDate ? shortRelativeDate(activity.date) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      className={`flex items-center gap-3 px-5 py-3.5 ${canUndo ? "long-pressable" : ""}`}
      {...(canUndo ? press : undefined)}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: "var(--accent)" }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[15px] font-medium">{title}</p>
        <p className="mt-0.5 mb-0 text-[12px] text-ink-soft">{detail}</p>
      </div>
      <span className="shrink-0 text-[13px] text-ink-soft">
        +{XP_BY_INTENSITY[activity.intensity]}
      </span>
    </li>
  );
}
