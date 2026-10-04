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
import { CategoryIcon } from "./CategoryIcon";
import { MissionKindIcon } from "./MissionIcons";

/** Alternating tilt, for the same collage as the cards. */
const TILTS = ["-0.6deg", "0.5deg", "-0.3deg", "0.7deg", "-0.5deg"];

/**
 * One mission. Two targets, two jobs: the diamond on the left ticks it off,
 * the rest of the row opens it for editing. Ticking is the thing you do every
 * day, so it gets its own target instead of a gesture to discover.
 */
export function MissionRow({
  mission: m,
  category,
  index,
  stamping,
  gain,
  busy,
  highlighted,
  onToggle,
  onOpen,
}: {
  mission: Mission;
  category: Category | undefined;
  index: number;
  /** Mid-completion: the slash and the stamp are playing. */
  stamping: boolean;
  /** XP just earned, shown on the stamp's beat. */
  gain: number | null;
  busy: boolean;
  highlighted: boolean;
  onToggle: (el: HTMLElement) => void;
  onOpen: () => void;
}) {
  const done = m.completedAt !== null;
  const group = missionGroup(m);
  const kind = missionKind(m.title);
  const accent = category ? categoryColorVar(category.slug) : null;
  const locked = done && !canReopen(m);

  return (
    <li
      className={`mission-row relative ${
        stamping ? "mission-leaving" : "anim-card"
      } ${highlighted ? "anim-highlight" : ""}`}
      style={
        {
          "--rotation": TILTS[index % TILTS.length],
          "--delay": `${0.14 + index * 0.05}s`,
          "--accent": accent ?? "var(--color-yellow)",
        } as React.CSSProperties
      }
    >
      <div
        style={{
          filter: `drop-shadow(5px 5px 0 ${
            done
              ? "rgb(245 245 240 / 0.22)"
              : group === "overdue"
                ? "var(--color-cuerpo)"
                : (accent ?? "var(--color-bone)")
          })`,
        }}
      >
        <div className="card-clip flex bg-black">
          <button
            type="button"
            role="checkbox"
            aria-checked={done || stamping}
            aria-label={done ? `Desmarcar: ${m.title}` : `Cumplir: ${m.title}`}
            title={
              locked
                ? "Se cumplió otro día y su XP ya cuenta: se queda hecha."
                : undefined
            }
            disabled={busy || stamping || locked}
            onClick={(e) => onToggle(e.currentTarget)}
            className="mission-check disabled:cursor-default"
          >
            <i />
            {(done || stamping) && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3.6}
                strokeLinecap="square"
                aria-hidden="true"
              >
                <path d="m6 12.5 4 4 8-9" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={onOpen}
            className="block min-w-0 flex-1 text-left"
          >
            <div className="slam-content py-3 pr-4">
              <h3
                className={`relative m-0 font-display text-[15px] leading-tight break-words uppercase ${
                  done ? "mission-done-title" : "text-bone"
                }`}
              >
                {m.title}
                {stamping && <span className="mission-slash" />}
              </h3>

              <Meta mission={m} kind={kind} category={category} />
            </div>
          </button>
        </div>
      </div>

      {stamping && <span className="mission-stamp">¡HECHA!</span>}

      {gain !== null && (
        <span
          className="anim-slam pointer-events-none absolute right-4 -bottom-2 z-20 bg-yellow px-1.5 py-0.5 font-display text-[11px] leading-none text-black"
          style={{ transform: "skewX(-10deg)" }}
        >
          <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
            +{gain} XP
          </span>
        </span>
      )}
    </li>
  );
}

/** The line under the title: what kind of errand, when, and what it is worth. */
function Meta({
  mission: m,
  kind,
  category,
}: {
  mission: Mission;
  kind: ReturnType<typeof missionKind>;
  category: Category | undefined;
}) {
  const done = m.completedAt !== null;
  const group = missionGroup(m);

  if (!kind && !m.dueDate && !category && !done) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[9.5px] font-bold tracking-[0.1em]">
      {kind && <MissionKindIcon kind={kind} className="h-4 w-4 text-bone/70" />}

      {done ? (
        <span className="text-bone/55">
          HECHA {shortRelativeDate(m.completedAt!)}
        </span>
      ) : (
        m.dueDate && (
          <span
            className={`px-1.5 py-0.5 ${
              group === "overdue"
                ? "bg-cuerpo text-bone"
                : group === "today"
                  ? "bg-yellow text-black"
                  : "border border-bone/40 text-bone/80"
            }`}
            style={{ transform: "skewX(-10deg)" }}
          >
            <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
              {group === "overdue"
                ? `VENCIDA · ${dueLabel(m.dueDate)}`
                : dueLabel(m.dueDate)}
            </span>
          </span>
        )
      )}

      {category && (
        <span
          className={`flex items-center gap-1 ${done ? "opacity-55" : ""}`}
          style={{ color: categoryColorVar(category.slug) }}
        >
          <CategoryIcon
            slug={category.slug}
            strokeWidth={2.6}
            className="h-3.5 w-3.5"
          />
          +{MISSION_XP} XP
        </span>
      )}
    </div>
  );
}
