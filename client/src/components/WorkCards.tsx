import type { Intensity, Work } from "../api/client";
import { sinceLastActivity } from "../lib/dates";
import { KIND_LABEL, SESSION_VERB } from "../lib/works";
import { QuickIntensities } from "./QuickIntensities";
import { Rating } from "./Rating";
import { WorkKindIcon } from "./WorkIcons";

const TILTS = ["-0.8deg", "0.6deg", "-0.4deg", "0.9deg", "-0.6deg"];
const MENTE = "var(--color-mente)";

/** The small tape naming the kind: icon and word. */
function KindTape({ work }: { work: Work }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 bg-bone px-1.5 py-0.5 text-[9px] font-bold tracking-[0.14em] text-black uppercase"
      style={{ transform: "skewX(-10deg)" }}
    >
      <span
        className="inline-flex items-center gap-1.5"
        style={{ transform: "skewX(10deg)" }}
      >
        <WorkKindIcon kind={work.kind} className="h-3.5 w-3.5" />
        {KIND_LABEL[work.kind].one}
      </span>
    </span>
  );
}

/**
 * Something in play. The body opens it for editing; SESIÓN unfolds the three
 * intensities — "today I played / read / watched" lands in Mente, the same
 * two-tap gesture as a focus on the home — and TERMINADO sends it to the
 * trophy case.
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
  /** Mid-completion: the stamp is playing and the card is about to leave. */
  finishing: boolean;
  onToggleSession: () => void;
  onPick: (intensity: Intensity, chip: HTMLElement) => void;
  onFinish: () => void;
  onOpen: () => void;
}) {
  const last = w.lastSessionAt
    ? `ÚLTIMA SESIÓN · ${sinceLastActivity(w.lastSessionAt).text}`
    : "SIN SESIONES";

  return (
    <li
      className={`category-card relative ${finishing ? "fling-out" : "anim-card"}`}
      style={
        {
          "--rotation": TILTS[index % TILTS.length],
          "--delay": `${0.16 + index * 0.06}s`,
          "--accent": MENTE,
        } as React.CSSProperties
      }
    >
      <div style={{ filter: `drop-shadow(6px 6px 0 ${MENTE})` }}>
        <div className="card-clip bg-black">
          <button
            type="button"
            onClick={onOpen}
            className="block w-full text-left"
            aria-label={`Editar ${w.title}`}
          >
            <div className="slam-content px-4 pt-4 pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <KindTape work={w} />
                <span className="text-[9px] font-bold tracking-[0.12em] text-bone/60">
                  {last}
                </span>
              </div>
              <h3 className="mt-2.5 mb-0 font-display text-[19px] leading-tight break-words text-bone uppercase">
                {w.title}
              </h3>
              {w.progress && (
                <p className="mt-1.5 mb-0 text-[11px] font-bold tracking-[0.08em] text-yellow">
                  ▸ {w.progress}
                </p>
              )}
            </div>
          </button>

          <div className="slam-content flex gap-2.5 px-4 pt-1.5 pb-4">
            <button
              type="button"
              onClick={onToggleSession}
              aria-expanded={open}
              disabled={menteId === null || finishing}
              className="option-chip"
              aria-pressed={open}
            >
              <span>{SESSION_VERB[w.kind]} hoy</span>
            </button>
            <button
              type="button"
              onClick={onFinish}
              disabled={finishing}
              className="option-chip ml-auto"
            >
              <span>✓ Terminado</span>
            </button>
          </div>

          {open && menteId !== null && (
            <div className="slam-content px-4 pb-4">
              <QuickIntensities categoryId={menteId} busy={busy} onPick={onPick} />
            </div>
          )}
        </div>
      </div>

      {finishing && <span className="stamp-mark">¡COMPLETADO!</span>}

      {gain !== null && (
        <span
          className="anim-slam pointer-events-none absolute right-4 -bottom-2 z-20 bg-yellow px-1.5 py-0.5 font-display text-[11px] leading-none text-black"
          style={{ transform: "skewX(-10deg)" }}
        >
          <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
            +{gain} XP EN MENTE
          </span>
        </span>
      )}
    </li>
  );
}

/** Something queued up: compact, with the one action it has — starting it. */
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
      className="mission-row anim-card"
      style={
        {
          "--rotation": TILTS[(index + 2) % TILTS.length],
          "--delay": `${0.2 + index * 0.05}s`,
        } as React.CSSProperties
      }
    >
      <div style={{ filter: "drop-shadow(4px 4px 0 var(--color-bone))" }}>
        <div className="card-clip flex items-center bg-black">
          <button
            type="button"
            onClick={onOpen}
            className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left"
          >
            <WorkKindIcon
              kind={w.kind}
              className="slam-content h-5 w-5 shrink-0 text-bone/70"
            />
            <span className="slam-content min-w-0 font-display text-[14px] leading-tight break-words text-bone uppercase">
              {w.title}
            </span>
          </button>
          <button
            type="button"
            onClick={onStart}
            disabled={busy}
            className="slam-content mr-4 ml-2 shrink-0 bg-yellow px-2 py-1 font-display text-[10px] text-black uppercase"
          >
            Empezar
          </button>
        </div>
      </div>
    </li>
  );
}

const MONTHS = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

/** A finished work in the trophy case. */
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
      className="trophy anim-card"
      style={
        {
          "--rotation": TILTS[(index + 1) % TILTS.length],
          "--delay": `${0.24 + index * 0.04}s`,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        onClick={onOpen}
        className="card-clip relative block h-full w-full bg-black px-3 pt-3 pb-3.5 text-left"
      >
        <WorkKindIcon
          kind={w.kind}
          className="pointer-events-none absolute -right-2 -bottom-2 h-16 w-16 text-bone/10"
        />
        <div className="slam-content relative">
          <p className="m-0 text-[8.5px] font-bold tracking-[0.14em] text-yellow uppercase">
            {KIND_LABEL[w.kind].one}
            {done && ` · ${MONTHS[done.getMonth()]} ${done.getFullYear()}`}
          </p>
          <h3 className="mt-1.5 mb-2.5 font-display text-[13px] leading-tight break-words text-bone uppercase">
            {w.title}
          </h3>
          {w.rating !== null ? (
            <Rating value={w.rating} size={9} />
          ) : (
            <span className="text-[9px] font-bold tracking-[0.12em] text-bone/45">
              SIN NOTA
            </span>
          )}
        </div>
      </button>
    </li>
  );
}
