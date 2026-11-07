import type { Category, Mission } from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { shortRelativeDate } from "../lib/dates";
import {
  canReopen,
  missionGroup,
  missionKind,
  MISSION_XP,
} from "../lib/missions";
import { MissionKindIcon } from "./MissionIcons";
import { vtName } from "../lib/viewTransition";

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/**
 * One mission, as a line on the page. Two targets, two jobs: the ring on the
 * left ticks it off, the rest of the line opens it for editing. The day it is
 * due sits on the right as a small token, so a list of errands reads as a
 * little calendar at a glance.
 */
export function MissionRow({
  mission: m,
  category,
  completing,
  gain,
  busy,
  highlighted,
  onToggle,
  onOpen,
}: {
  mission: Mission;
  category: Category | undefined;
  /** Being ticked off: the ring fills and the title crosses out. */
  completing: boolean;
  /** XP just earned, shown for a moment. */
  gain: number | null;
  busy: boolean;
  highlighted: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const done = m.completedAt !== null;
  const checked = done || completing;
  const kind = missionKind(m.title);
  const accent = category ? categoryColorVar(category.slug) : null;
  const locked = done && !canReopen(m);

  return (
    <li
      className={`mission-line ${highlighted ? "highlight" : ""}`}
      style={
        {
          "--accent": accent ?? undefined,
          // Its name lets it glide to its new place when it is ticked off.
          ...vtName(`mission-${m.id}`, "row"),
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={done ? `Desmarcar: ${m.title}` : `Cumplir: ${m.title}`}
        title={locked ? "Se cumplió otro día y su XP ya cuenta: se queda hecha." : undefined}
        disabled={busy || completing || locked}
        onClick={onToggle}
        className={`mission-check ${completing ? "pop" : ""}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path className="tick" pathLength={1} d="m5.5 12.5 4 4 9-10" />
        </svg>
      </button>

      <button type="button" onClick={onOpen} className="min-w-0 flex-1 py-3 text-left">
        <span className="text-[16px] leading-snug break-words">
          <span className="strike" data-on={checked}>
            {m.title}
          </span>
        </span>
        <Meta mission={m} kind={kind} accent={accent} gain={gain} />
      </button>

      <DueToken mission={m} />
    </li>
  );
}

/** The day a mission is due, as a token; nothing for "someday". */
function DueToken({ mission: m }: { mission: Mission }) {
  if (m.completedAt !== null || !m.dueDate) return null;
  const group = missionGroup(m);
  const [, mm, dd] = m.dueDate.split("-").map(Number);

  return (
    <span
      className="due-token"
      data-when={group === "overdue" ? "overdue" : group === "today" ? "today" : "later"}
      aria-label={group === "today" ? "Para hoy" : `Para el ${dd} de ${MONTHS[mm - 1]}`}
    >
      {group === "today" ? (
        <b className="py-1.5 text-[12px] font-semibold">Hoy</b>
      ) : (
        <>
          <b className="display text-[19px] font-medium">{dd}</b>
          <span className="mt-0.5 text-[10px] font-semibold tracking-wide uppercase">
            {MONTHS[mm - 1]}
          </span>
        </>
      )}
    </span>
  );
}

/** The line under the title: what kind of errand and what it is worth. */
function Meta({
  mission: m,
  kind,
  accent,
  gain,
}: {
  mission: Mission;
  kind: ReturnType<typeof missionKind>;
  accent: string | null;
  gain: number | null;
}) {
  const done = m.completedAt !== null;
  const overdue = missionGroup(m) === "overdue";

  if (!kind && !accent && !done && !overdue && gain === null) return null;

  return (
    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-soft">
      {kind && <MissionKindIcon kind={kind} className="h-4 w-4 text-ink-faint" />}
      {done && <span>Hecha {shortRelativeDate(m.completedAt!).toLowerCase()}</span>}
      {overdue && <span className="font-medium text-warn">Vencida</span>}
      {accent && (
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
          +{MISSION_XP} XP
        </span>
      )}
      {gain !== null && (
        <span className="gain font-semibold" style={{ color: accent ?? undefined }}>
          +{gain} XP
        </span>
      )}
    </span>
  );
}
