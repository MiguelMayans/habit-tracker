import type { Intensity, Work } from "../api/client";
import { sinceLastActivity } from "../lib/dates";
import { KIND_COLOR, KIND_LABEL, SESSION_VERB } from "../lib/works";
import { QuickIntensities } from "./QuickIntensities";
import { Collapse } from "./Collapse";
import { WorkKindIcon } from "./WorkIcons";
import { vtName } from "../lib/viewTransition";

/**
 * Something in play, as a poster: its kind's colour in a deep gradient, the
 * kind's icon huge as the poster's motif, and the title set big at the foot
 * — the way a streaming shelf or a record sleeve shows it, not a form row.
 * Posters stack down the page, so everything in play is seen at a glance.
 *
 * The poster itself opens it for editing; the dots set how far through it
 * is; "He jugado hoy" unfolds the intensities for a session in Mente; and
 * "Terminado" sends it to the shelf.
 */
export function ActiveWorkCard({
  work: w,
  menteId,
  open,
  busy,
  gain,
  finishing,
  onToggleSession,
  onPick,
  onFinish,
  onOpen,
  onPercent,
}: {
  work: Work;
  menteId: number | null;
  open: boolean;
  busy: boolean;
  gain: number | null;
  /** Being finished: its buttons rest while the request runs. */
  finishing: boolean;
  onToggleSession: () => void;
  onPick: (intensity: Intensity) => void;
  onFinish: () => void;
  onOpen: () => void;
  /** Sets how far through it is, from the dots. */
  onPercent: (percent: number) => void;
}) {
  const last = w.lastSessionAt
    ? sinceLastActivity(w.lastSessionAt).text.toLowerCase()
    : "sin sesiones";

  return (
    <li
      className="poster"
      style={
        {
          "--accent": KIND_COLOR[w.kind],
          // Named, so finishing it flies the poster onto the shelf.
          ...vtName(`work-${w.id}`, "row"),
        } as React.CSSProperties
      }
    >
      <WorkKindIcon kind={w.kind} className="poster-motif" />

      {/* Finishing it, in the corner: the one action that ends its time
          here, kept apart from the everyday ones. */}
      <button
        type="button"
        onClick={onFinish}
        disabled={finishing}
        className="chip absolute top-2.5 right-2.5 z-10 h-8 w-8 justify-center !p-0"
        aria-label={`Terminado: ${w.title}`}
        title="Terminado"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
          <path d="m5.5 12.5 4 4 9-10" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="relative flex flex-1 flex-col text-left"
        aria-label={`Editar ${w.title}`}
      >
        <span className="pr-10 text-[10px] font-semibold tracking-[0.16em] text-paper/75 uppercase">
          {KIND_LABEL[w.kind].one} · {last}
        </span>
        <h3 className="display m-0 mt-1.5 pr-14 text-[21px] leading-[1.1] break-words text-paper">
          {w.title}
        </h3>
        {w.progress && (
          <span className="mt-0.5 text-[12px] text-paper/80">{w.progress}</span>
        )}
        {gain !== null && (
          <span className="gain mt-1 text-[13px] font-semibold text-paper">
            +{gain} XP en Mente
          </span>
        )}
      </button>

      <div className="relative mt-3 flex items-center gap-2">
        <ProgressDots percent={w.percent} onSet={onPercent} />
        <button
          type="button"
          onClick={onToggleSession}
          aria-expanded={open}
          aria-pressed={open}
          disabled={menteId === null || finishing}
          className="chip ml-auto whitespace-nowrap"
        >
          {SESSION_VERB[w.kind]} hoy
        </button>
      </div>

      {menteId !== null && (
        <Collapse open={open}>
          <div className="relative pt-3">
            <QuickIntensities categoryId={menteId} busy={busy} onPick={onPick} />
          </div>
        </Collapse>
      )}
    </li>
  );
}

/**
 * How far through a work is, as ten dots, with the figure beside them. A dot
 * is worth ten, and can be half full for the "and five": 55 % is five full
 * dots and a half. Tapping the dot at the edge cycles it — full, half,
 * empty — so every step of five is two taps away at most; tapping any other
 * dot jumps straight to it. The dots fill one after another, so a change
 * flows rather than jumps.
 */
function ProgressDots({
  percent,
  onSet,
}: {
  percent: number | null;
  onSet: (percent: number) => void;
}) {
  const value = percent ?? 0;

  /** What tapping dot `i` sets: full, then half, then empty. */
  function next(i: number): number {
    const full = (i + 1) * 10;
    if (value === full) return i * 10 + 5;
    if (value === i * 10 + 5) return i * 10;
    return full;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="dots" role="group" aria-label="Cuánto llevas">
        {Array.from({ length: 10 }, (_, i) => {
          const fill =
            value >= (i + 1) * 10 ? "full" : value >= i * 10 + 5 ? "half" : "empty";
          return (
            <button
              key={i}
              type="button"
              aria-label={`${next(i)} %`}
              data-fill={fill}
              onClick={() => onSet(next(i))}
              style={{ "--i": i } as React.CSSProperties}
            />
          );
        })}
      </div>
      <span className="text-[12px] font-semibold whitespace-nowrap tabular-nums text-paper/85">
        {percent === null ? "—" : `${value} %`}
      </span>
    </div>
  );
}

/**
 * Something waiting its turn: a slim pill in its kind's colour, with the one
 * action it has. A queue, not a stack of cards.
 */
export function QueuedWorkRow({
  work: w,
  busy,
  onStart,
  onOpen,
}: {
  work: Work;
  busy: boolean;
  onStart: () => void;
  onOpen: () => void;
}) {
  return (
    <li
      className="queue-pill"
      style={
        {
          "--accent": KIND_COLOR[w.kind],
          ...vtName(`work-${w.id}`, "row"),
        } as React.CSSProperties
      }
    >
      <span className="icon-solid h-8 w-8">
        <WorkKindIcon kind={w.kind} className="h-4 w-4" />
      </span>
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 truncate text-left text-[15px] font-medium"
      >
        {w.title}
      </button>
      <button type="button" onClick={onStart} disabled={busy} className="chip shrink-0">
        Empezar
      </button>
    </li>
  );
}

/**
 * A finished work on the wall: a small square in its kind's colour, the
 * poster's little sister — motif in the corner, the title, the rating.
 */
export function TrophyTile({
  work: w,
  onOpen,
}: {
  work: Work;
  onOpen: () => void;
}) {
  return (
    <li
      style={
        {
          "--accent": KIND_COLOR[w.kind],
          ...vtName(`work-${w.id}`, "row"),
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        onClick={onOpen}
        className="tile"
        aria-label={`${w.title}${w.rating ? `, ${w.rating} de 5` : ""}`}
      >
        <WorkKindIcon kind={w.kind} className="tile-motif" />
        <span className="display relative line-clamp-3 text-[14px] leading-[1.1]">
          {w.title}
        </span>
        {w.rating !== null && (
          <span className="relative mt-1.5 flex gap-[3px]" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <i
                key={i}
                className={`block h-1.5 w-1.5 rounded-full ${i < w.rating! ? "bg-paper" : "bg-paper/30"}`}
              />
            ))}
          </span>
        )}
      </button>
    </li>
  );
}
