import type { Intensity, Work } from "../api/client";
import { sinceLastActivity } from "../lib/dates";
import { KIND_COLOR, KIND_LABEL, SESSION_VERB } from "../lib/works";
import { QuickIntensities } from "./QuickIntensities";
import { Rating } from "./Rating";
import { WorkKindIcon } from "./WorkIcons";

/**
 * Something in play. The body opens it for editing; "He jugado hoy" unfolds
 * the three intensities — a session lands in Mente, the same two-tap gesture
 * as a focus on the home — and "Terminado" moves it to the shelf.
 */
export function ActiveWorkCard({
  work: w,
  menteId,
  index,
  open,
  busy,
  gain,
  finishing,
  onToggleSession,
  onPick,
  onFinish,
  onOpen,
}: {
  work: Work;
  menteId: number | null;
  index: number;
  open: boolean;
  busy: boolean;
  gain: number | null;
  /** Being finished: it fades out on its way to the shelf. */
  finishing: boolean;
  onToggleSession: () => void;
  onPick: (intensity: Intensity) => void;
  onFinish: () => void;
  onOpen: () => void;
}) {
  const last = w.lastSessionAt
    ? `Última sesión: ${sinceLastActivity(w.lastSessionAt).text.toLowerCase()}`
    : "Sin sesiones todavía";

  return (
    <li
      className={`card-color ${finishing ? "leaving" : "settle"}`}
      style={
        {
          "--delay": `${0.06 + index * 0.04}s`,
          "--accent": KIND_COLOR[w.kind],
        } as React.CSSProperties
      }
    >
      <WorkKindIcon kind={w.kind} className="watermark" />
      <button
        type="button"
        onClick={onOpen}
        className="press-card relative block w-full px-5 pt-5 pb-3 text-left"
        aria-label={`Editar ${w.title}`}
      >
        <h3 className="display m-0 text-[22px] leading-tight break-words">{w.title}</h3>
        <p className="mt-1 mb-0 text-[13px] text-ink-soft">
          {w.progress ? `${w.progress} · ` : ""}
          {last}
        </p>
        {gain !== null && (
          <p className="gain mt-1 mb-0 text-[13px] font-semibold" style={{ color: "var(--color-mente)" }}>
            +{gain} XP en Mente
          </p>
        )}
      </button>

      <div className="relative flex gap-2 px-5 pb-4">
        <button
          type="button"
          onClick={onToggleSession}
          aria-expanded={open}
          aria-pressed={open}
          disabled={menteId === null || finishing}
          className="chip"
        >
          {SESSION_VERB[w.kind]} hoy
        </button>
        <button
          type="button"
          onClick={onFinish}
          disabled={finishing}
          className="chip ml-auto"
        >
          Terminado
        </button>
      </div>

      {open && menteId !== null && (
        <div className="relative px-5 pb-3">
          <QuickIntensities categoryId={menteId} busy={busy} onPick={onPick} />
        </div>
      )}
    </li>
  );
}

/** Something waiting its turn: compact, with the one action it has. */
export function QueuedWorkRow({
  work: w,
  index,
  busy,
  onStart,
  onOpen,
}: {
  work: Work;
  index: number;
  busy: boolean;
  onStart: () => void;
  onOpen: () => void;
}) {
  return (
    <li
      className="card card-tinted settle flex items-center"
      style={
        {
          "--delay": `${0.08 + index * 0.03}s`,
          "--accent": KIND_COLOR[w.kind],
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 py-3.5 pl-5 text-left text-[15px] font-medium break-words"
      >
        {w.title}
      </button>
      <button
        type="button"
        onClick={onStart}
        disabled={busy}
        className="chip mr-3 ml-2 shrink-0"
      >
        Empezar
      </button>
    </li>
  );
}

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** A finished work on the shelf. */
export function TrophyTile({
  work: w,
  index,
  onOpen,
}: {
  work: Work;
  index: number;
  onOpen: () => void;
}) {
  const done = w.finishedAt ? new Date(w.finishedAt) : null;

  return (
    <li
      className="settle"
      style={
        { "--delay": `${0.1 + index * 0.03}s`, "--accent": KIND_COLOR[w.kind] } as React.CSSProperties
      }
    >
      <button
        type="button"
        onClick={onOpen}
        className="card card-tinted press flex h-full w-full flex-col items-start gap-2 px-4 pt-4 pb-4 text-left"
      >
        <span className="flex items-center gap-1.5 text-[12px] text-ink-soft">
          <WorkKindIcon kind={w.kind} className="h-3.5 w-3.5 text-(--accent)" />
          {KIND_LABEL[w.kind].one}
          {done && ` · ${MONTHS[done.getMonth()]} ${done.getFullYear()}`}
        </span>
        <span className="display text-[18px] leading-tight break-words">{w.title}</span>
        <span className="mt-auto pt-1">
          {w.rating !== null ? (
            <Rating value={w.rating} size={7} />
          ) : (
            <span className="text-[12px] text-ink-faint">Sin nota</span>
          )}
        </span>
      </button>
    </li>
  );
}
