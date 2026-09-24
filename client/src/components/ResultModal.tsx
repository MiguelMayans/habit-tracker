import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { Category, RegisterActivityResult, XpOutcome } from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { isToday } from "../lib/dates";
import { useCountUp } from "../lib/useCountUp";
import { CategoryIcon } from "./CategoryIcon";
import { ConfirmDialog } from "./ConfirmDialog";
import { LevelNumber } from "./LevelNumber";

/** Beats of the sequence, in ms from the moment the modal opens. */
const T_START = 380;
const T_FILL = 1250;
/** The held beat between topping out and the level landing. */
const T_HOLD = 110;
const T_BURST = 420;

/**
 * What you see when you log something. The bar is not painted in its final
 * state: it starts where it was and climbs. If the level goes up it reaches
 * the top, bursts and starts again from zero — which is the moment this whole
 * screen exists for.
 */
export function ResultModal({
  result,
  category,
  backTo,
  onClose,
  onUndo,
}: {
  result: RegisterActivityResult;
  category: Category | undefined;
  /**
   * Where the trip ends. The id of the category you came from, "" for the
   * home, or `null` when you are already looking at the screen underneath —
   * logging from a card on the home— and there is nowhere to go back to.
   */
  backTo: string | null;
  onClose: () => void;
  /** Calls DELETE /activities/:id. Throws on failure — the dialog shows it. */
  onUndo: () => Promise<void>;
}) {
  const accent = category
    ? categoryColorVar(category.slug)
    : "var(--color-yellow)";

  // This is the exact moment you realise you got it wrong, so the gesture
  // lives right here and not only buried in the history. It is offered only
  // for a log from today: the server would refuse any other.
  const canUndo = isToday(result.activity.date);
  const countedXp = useCountUp(result.xpGained, { from: 0, ms: 900 });
  const [confirming, setConfirming] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function confirmUndo() {
    setUndoError(null);
    setUndoing(true);

    try {
      await onUndo();
      // Genuinely undone: there is nothing left to look at in this modal.
      onClose();
    } catch (err) {
      setUndoError((err as Error).message);
    } finally {
      setUndoing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
    >
      {/* The backdrop's burst at full blast, in the category's colour. */}
      <div
        className="burst-blast"
        style={{ "--blast": accent } as React.CSSProperties}
      />
      <div className="burst-blast-tone" />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-5 py-10">
        {/* A bone tape, like every other label that has to sit over the
            burst: grey text on the rays was crossed out by them. */}
        <p
          id="result-title"
          className="anim-row m-0 self-start bg-bone px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-black"
          style={{ transform: "skewX(-10deg)" }}
        >
          <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
            ACTIVIDAD REGISTRADA
          </span>
        </p>

        {/* The figure counts up from zero instead of already being there. It
            is the number this screen exists for: watching it arrive is the
            reward, finding it already there is a statistic. */}
        <p
          className="anim-slam text-sign m-0 mt-3 font-display text-[64px] leading-none text-yellow"
          style={{ transform: "skewX(-8deg)" }}
        >
          +{countedXp}
          <span className="text-[26px]"> XP</span>
        </p>

        {/* The bars sit on a black panel of their own, like every card in the
            app: over the burst, bare text would be crossed by rays. */}
        <div
          className="anim-row mt-8"
          style={
            {
              "--delay": "0.12s",
              filter: `drop-shadow(8px 8px 0 ${accent})`,
            } as React.CSSProperties
          }
        >
          <div className="card-clip grid gap-7 bg-black px-4 pt-5 pb-6">
          <XpBlock
            title={category?.name ?? "Categoría"}
            slug={category?.slug}
            accent={accent}
            data={result.category}
          />
          {result.focus && (
            <XpBlock
              title="Foco"
              accent={accent}
              data={result.focus}
              delay={180}
            />
          )}
          </div>
        </div>

        {/* Logged from the home there is no trip to close: the screen you
            want is already behind. The link said "Ver categorías" and did
            nothing visible —it navigated to "/" while on "/"— and left the
            modal open, because the card rendering it does not unmount. There,
            a single button that closes. */}
        <div
          className="anim-row mt-10 grid gap-3"
          style={{ "--delay": "0.9s" } as React.CSSProperties}
        >
          {backTo === null ? (
            <button type="button" onClick={onClose} className="slam-button w-full">
              <span>Seguir</span>
            </button>
          ) : (
            <>
              <Link
                to={backTo === "" ? "/" : `/categories/${backTo}`}
                className="slam-button w-full"
              >
                <span>{backTo === "" ? "Ver categorías" : "Volver"}</span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="slam-button w-full"
                style={{
                  background: "transparent",
                  color: "var(--color-yellow)",
                  boxShadow: "none",
                  border: "2px solid var(--color-yellow)",
                }}
              >
                <span>Registrar otra</span>
              </button>
            </>
          )}

          {canUndo && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-1 text-[10px] font-bold tracking-[0.16em] text-bone/60 underline"
            >
              ME HE EQUIVOCADO · DESHACER
            </button>
          )}
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          bandTitle="¿Deshacer registro?"
          titleId="undo-modal-title"
          busy={undoing}
          error={undoError}
          confirmLabel="Deshacer"
          busyLabel="Deshaciendo…"
          onConfirm={confirmUndo}
          onCancel={() => setConfirming(false)}
        >
          <p className="m-0 font-display text-[20px] leading-tight text-bone uppercase">
            +{result.xpGained} XP
          </p>
          <p className="mt-4 text-[11.5px] leading-relaxed text-bone/75">
            Se le resta esa XP al foco (si lo tenía) y a la categoría, y el
            nivel puede bajar si corresponde.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}

function XpBlock({
  title,
  slug,
  accent,
  data,
  delay = 0,
}: {
  title: string;
  slug?: string;
  accent: string;
  data: XpOutcome;
  delay?: number;
}) {
  // Current bar width, and whether it should animate: when restarting after a
  // level-up it has to snap to zero with no transition, or you would watch it
  // travel backwards.
  const [width, setWidth] = useState(data.progressBefore);
  const [animated, setAnimated] = useState(false);
  const [shownLevel, setShownLevel] = useState(data.levelBefore);
  const [celebrating, setCelebrating] = useState(false);
  // The wind-up: the bar has topped out and is holding, just before the hit.
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    const timers: number[] = [];
    const t = (ms: number, fn: () => void) =>
      timers.push(window.setTimeout(fn, delay + ms));

    if (!data.leveledUp) {
      t(T_START, () => {
        setAnimated(true);
        setWidth(data.progressAfter);
      });
    } else {
      // 1. Climb all the way to the top. It accelerates into the ceiling
      //    instead of easing out: a bar that slows down as it arrives reads
      //    as running out of steam, which is the opposite of what is about
      //    to happen.
      t(T_START, () => {
        setAnimated(true);
        setWidth(1);
      });
      // 2. Wind-up: topped out, white, swollen, and nothing else moving.
      t(T_START + T_FILL, () => setCharging(true));
      // 3. The hit: flash, new number, shake, and the bar blowing out.
      t(T_START + T_FILL + T_HOLD, () => {
        setCelebrating(true);
        setShownLevel(data.levelAfter);
      });
      // 4. The bar snaps back to zero, with no transition.
      t(T_START + T_FILL + T_HOLD + 120, () => {
        setAnimated(false);
        setWidth(0);
        setCharging(false);
      });
      // 5. And the new level starts filling.
      t(T_START + T_FILL + T_HOLD + T_BURST, () => {
        setAnimated(true);
        setWidth(data.progressAfter);
      });
    }

    return () => timers.forEach(window.clearTimeout);
  }, [data, delay]);

  return (
    <div className={celebrating ? "anim-shake relative" : "relative"}>
      {/* Through a portal to the body: this block carries `anim-shake` right
          when the flash appears, and an ancestor with a `transform` turns
          `position: fixed` into `absolute` relative to it. The "full-screen"
          flash had always been trapped inside the shaking block. */}
      {celebrating &&
        createPortal(
          <div
            className="anim-flash pointer-events-none fixed inset-0 z-[60]"
            style={{ background: "var(--color-bone)" }}
          />,
          document.body,
        )}

      <div className="flex items-end gap-2.5">
        {slug && (
          <CategoryIcon
            slug={slug}
            strokeWidth={2.4}
            className="mb-1 h-6 w-6 shrink-0"
            style={{ color: accent }}
          />
        )}
        <h2
          className="m-0 font-display text-[19px] leading-none uppercase"
          style={{ color: accent }}
        >
          {title}
        </h2>

        <span className="relative ml-auto flex items-baseline gap-1.5">
          {celebrating && (
            <span
              className="anim-burst pointer-events-none absolute -inset-10 -z-10"
              style={{
                background:
                  "repeating-conic-gradient(from 0deg at 50% 50%, var(--color-yellow) 0deg 5deg, transparent 5deg 13deg)",
                WebkitMaskImage:
                  "radial-gradient(circle at 50% 50%, #000 10%, transparent 62%)",
                maskImage:
                  "radial-gradient(circle at 50% 50%, #000 10%, transparent 62%)",
              }}
            />
          )}
          <span className="text-[9px] font-bold tracking-[0.24em] text-bone/60">
            NIVEL
          </span>
          <LevelNumber
            // The key remounts the number on level-up, which is what fires
            // its slam.
            key={shownLevel}
            value={shownLevel}
            size={36}
            slam={celebrating}
          />
        </span>
      </div>

      <div
        className={`xp-bar relative mt-3 h-5 overflow-hidden bg-[#242424] ${
          celebrating ? "anim-bar-hit" : charging ? "anim-bar-charge" : ""
        }`}
      >
        <div
          className="relative h-full bg-yellow"
          style={{
            width: `${Math.round(width * 100)}%`,
            // Climbing to the top it accelerates; settling into the new level it brakes.
            transition: animated
              ? data.leveledUp && width === 1
                ? "width 1.25s cubic-bezier(.4,0,.9,.5)"
                : "width 1s cubic-bezier(.2,.9,.25,1)"
              : "none",
          }}
        />
      </div>

      <div className="mt-2.5 flex items-center gap-2 text-[10px] font-semibold tracking-[0.06em] text-bone/70">
        <span>{data.totalXp} XP</span>
        <i className="h-[3px] w-[3px] rotate-45 bg-bone/50" />
        <span>
          {data.atMaxLevel ? (
            <b className="text-yellow">
              {data.frozen ? "CONGELADO" : "NIVEL MÁXIMO"}
            </b>
          ) : (
            <>
              <b className="text-yellow">{data.xpToNextLevel}</b> AL NV{" "}
              {data.levelAfter + 1}
            </>
          )}
        </span>
        {data.leveledUp && celebrating && (
          <span
            className="ml-auto bg-yellow px-2 py-0.5 text-[9px] font-bold tracking-[0.16em] text-black"
            style={{ transform: "skewX(-10deg)" }}
          >
            {data.frozen ? "¡MAESTRÍA!" : `¡SUBES A ${data.levelAfter}!`}
          </span>
        )}
      </div>
    </div>
  );
}
