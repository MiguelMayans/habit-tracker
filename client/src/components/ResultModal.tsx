import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Category, RegisterActivityResult, XpOutcome } from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { isToday } from "../lib/dates";
import { CategoryIcon } from "./CategoryIcon";
import { ConfirmDialog } from "./ConfirmDialog";

/** Beats of the sequence, in ms from the moment the modal opens. */
const T_START = 380;
const T_FILL = 850;
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
  /** Id of the category you came from, if the log arrived with context. */
  backTo: string;
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
      <div className="texture-diagonals" />
      <div className="texture-halftone" />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-5 py-10">
        <p
          id="result-title"
          className="anim-row text-[10px] font-bold tracking-[0.24em] text-bone/50"
        >
          ACTIVIDAD REGISTRADA
        </p>

        <p
          className="anim-slam text-sign m-0 mt-3 font-display text-[64px] leading-none text-yellow"
          style={{ transform: "skewX(-8deg)" }}
        >
          +{result.xpGained}
          <span className="text-[26px]"> XP</span>
        </p>

        <div className="mt-9 grid gap-7">
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

        {/* Closing leaves the form ready for another; the link ends the trip by
            taking you back where you came from. */}
        <div
          className="anim-row mt-10 grid gap-3"
          style={{ "--delay": "0.9s" } as React.CSSProperties}
        >
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

          {canUndo && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-[10px] font-bold tracking-[0.14em] text-bone/40 underline"
            >
              Me he equivocado, deshacer
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
      // 1. Climb all the way to the top.
      t(T_START, () => {
        setAnimated(true);
        setWidth(1);
      });
      // 2. Burst: flash, new number and shake.
      t(T_START + T_FILL, () => {
        setCelebrating(true);
        setShownLevel(data.levelAfter);
      });
      // 3. The bar snaps back to zero, with no transition.
      t(T_START + T_FILL + 120, () => {
        setAnimated(false);
        setWidth(0);
      });
      // 4. And the new level starts filling.
      t(T_START + T_FILL + T_BURST, () => {
        setAnimated(true);
        setWidth(data.progressAfter);
      });
    }

    return () => timers.forEach(window.clearTimeout);
  }, [data, delay]);

  return (
    <div className={celebrating ? "anim-shake relative" : "relative"}>
      {celebrating && (
        <div
          className="anim-flash pointer-events-none fixed inset-0 z-20"
          style={{ background: "var(--color-bone)" }}
        />
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
          <b
            // The key remounts the number on level-up, which is what fires its
            // entrance animation.
            key={shownLevel}
            className={`text-sign font-display text-[38px] leading-[0.82] text-yellow ${
              celebrating ? "anim-level-drop" : ""
            }`}
          >
            {shownLevel}
          </b>
        </span>
      </div>

      <div className="xp-bar relative mt-3 h-5 overflow-hidden bg-[#242424]">
        <div
          className="relative h-full bg-yellow"
          style={{
            width: `${Math.round(width * 100)}%`,
            transition: animated
              ? "width .85s cubic-bezier(.2,.9,.25,1)"
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
