import type { Category, Mission } from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { shortRelativeDate } from "../lib/dates";
import {
  canReopen,
  dueLabel,
  missionGroup,
  missionKind,
  MISSION_XP,
} from "../lib/missions";
import { MissionKindIcon } from "./MissionIcons";

/**
 * One mission. Two targets, two jobs: the circle on the left ticks it off,
 * the rest of the row opens it for editing. Ticking is the thing you do every
 * day, so it gets its own target instead of a gesture to discover.
 */
export function MissionRow({
  mission: m,
  category,
  index,
  completing,
  gain,
  busy,
  highlighted,
  onToggle,
  onOpen,
}: {
  mission: Mission;
  category: Category | undefined;
  index: number;
  /** Being ticked off: the circle fills, the title crosses out, it leaves. */
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
      className={`card flex items-start ${accent ? "card-tinted" : ""} ${
        completing ? "leaving" : "settle"
      } ${highlighted ? "highlight" : ""}`}
      style={
        {
          "--delay": `${0.04 + index * 0.03}s`,
          "--accent": accent ?? undefined,
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
        className="grid h-14 w-14 shrink-0 place-items-center"
      >
        <span
          className={`grid h-6 w-6 place-items-center rounded-full border-[1.5px] transition-colors duration-200 ${
            checked ? "border-ink bg-ink text-paper" : "border-ink-faint"
          } ${completing ? "pop" : ""}`}
        >
          {checked && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="m6 12.5 4 4 8-9" />
            </svg>
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="press-card block min-w-0 flex-1 py-4 pr-5 text-left"
      >
        <span
          className={`block text-[15px] leading-snug font-medium break-words transition-colors duration-200 ${
            checked ? "text-ink-faint line-through" : ""
          }`}
        >
          {m.title}
        </span>

        <Meta mission={m} kind={kind} accent={accent} gain={gain} />
      </button>
    </li>
  );
}

/** The line under the title: what kind of errand, when, and what it is worth. */
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
  const group = missionGroup(m);

  if (!kind && !m.dueDate && !accent && !done && gain === null) return null;

  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-soft">
      {kind && <MissionKindIcon kind={kind} className="h-4 w-4 text-ink-faint" />}

      {done ? (
        <span>Hecha {shortRelativeDate(m.completedAt!).toLowerCase()}</span>
      ) : (
        m.dueDate && (
          <span
            className={
              group === "overdue"
                ? "text-warn"
                : group === "today"
                  ? "font-semibold text-ink"
                  : undefined
            }
          >
            {group === "overdue" ? `Vencida · ${dueLabel(m.dueDate).toLowerCase()}` : dueLabel(m.dueDate)}
          </span>
        )
      )}

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
