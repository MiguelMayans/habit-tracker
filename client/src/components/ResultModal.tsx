import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Category, RegisterActivityResult, XpOutcome } from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { isToday } from "../lib/dates";
import { cue } from "../lib/sound";
import { CategoryIcon } from "./CategoryIcon";
import { ConfirmDialog } from "./ConfirmDialog";
import { DialogFrame } from "./DialogFrame";
import { LevelNumber } from "./LevelNumber";
import { Confetti } from "./Confetti";

/** Beats of the bar, in ms from the moment the sheet opens. */
const T_START = 300;
const T_FILL = 800;


/**
 * What you see after logging from the full form, or whenever a log raises a
 * level: what it was worth, and each bar moving from where it was to where it
 * is now. A level up is said in words and the bar simply starts again — no
 * flash, no banner. Quiet, but it is still the moment the screen is for.
 */
export function ResultModal({
  result,
  category,
  backTo = null,
  onClose,
  onUndo,
}: {
  result: RegisterActivityResult;
  category: Category | undefined;
  /**
   * Where "Volver" goes: the id of the category you came from, "" for the
   * home, or `null` when the screen underneath is already the right one and
   * closing is enough.
   */
  backTo?: string | null;
  onClose: () => void;
  /** Calls DELETE /activities/:id. Throws on failure — the dialog shows it. */
  onUndo: () => Promise<void>;
}) {
  const accent = category ? categoryColorVar(category.slug) : "var(--color-ink)";
  const leveled = result.category.leveledUp || result.focus?.leveledUp;

  // Offered only for a log from today: the server would refuse any other.
  const canUndo = isToday(result.activity.date);
  const [confirming, setConfirming] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  // One sound for the level up, even if the category and the focus both rise.
  const sounded = useRef(false);
  const onHit = () => {
    if (sounded.current) return;
    sounded.current = true;
    cue("levelUp");
  };

  async function confirmUndo() {
    setUndoError(null);
    setUndoing(true);
    try {
      await onUndo();
      onClose();
    } catch (err) {
      setUndoError((err as Error).message);
    } finally {
      setUndoing(false);
    }
  }

  const title = leveled
    ? result.category.leveledUp
      ? `${category?.name ?? "La categoría"} sube a nivel ${result.category.levelAfter}`
      : `Tu foco sube a nivel ${result.focus!.levelAfter}`
    : "Registrado";

  return (
    <>
      <DialogFrame titleId="result-title" title={title} onCancel={onClose}>
        {leveled && (
          <Confetti delay={(T_START + T_FILL) / 1000} />
        )}
        <p className="m-0 -mt-3 text-[15px] text-ink-soft">
          +{result.xpGained} XP
          {result.focus?.frozen && result.focus.leveledUp && " · el foco alcanza la maestría"}
        </p>

        <div className="mt-6 grid gap-5" style={{ "--accent": accent } as React.CSSProperties}>
          <XpBlock
            title={category?.name ?? "Categoría"}
            slug={category?.slug}
            data={result.category}
            onHit={onHit}
          />
          {result.focus && (
            <XpBlock title="Foco" data={result.focus} delay={150} onHit={onHit} />
          )}
        </div>

        <div className="mt-8 grid gap-3">
          {backTo === null ? (
            <button type="button" onClick={onClose} className="btn w-full">
              Hecho
            </button>
          ) : (
            <>
              <Link
                to={backTo === "" ? "/" : `/categories/${backTo}`}
                className="btn w-full"
              >
                Hecho
              </Link>
              <button type="button" onClick={onClose} className="btn btn-soft w-full">
                Registrar otra
              </button>
            </>
          )}

          {canUndo && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="link-quiet mt-1 justify-self-center"
            >
              Me he equivocado, deshacer
            </button>
          )}
        </div>
      </DialogFrame>

      {confirming && (
        <ConfirmDialog
          bandTitle="¿Deshacer el registro?"
          titleId="undo-modal-title"
          busy={undoing}
          error={undoError}
          confirmLabel="Deshacer"
          busyLabel="Deshaciendo…"
          onConfirm={confirmUndo}
          onCancel={() => setConfirming(false)}
        >
          <p className="m-0 text-[15px] leading-relaxed text-ink-soft">
            Se restan esos {result.xpGained} XP al foco (si lo tenía) y a la
            categoría, y el nivel vuelve a donde estaba si hace falta.
          </p>
        </ConfirmDialog>
      )}
    </>
  );
}

function XpBlock({
  title,
  slug,
  data,
  delay = 0,
  onHit,
}: {
  title: string;
  slug?: string;
  data: XpOutcome;
  delay?: number;
  /** Fired when the level changes, for the sound. */
  onHit: () => void;
}) {
  const hitRef = useRef(onHit);
  useEffect(() => {
    hitRef.current = onHit;
  }, [onHit]);

  // The bar starts where it was and travels. On a level up it fills to the
  // end, then starts again from zero with no transition (or you would watch
  // it go backwards) and fills to where it is now.
  const [width, setWidth] = useState(data.progressBefore);
  const [animated, setAnimated] = useState(true);
  const [shownLevel, setShownLevel] = useState(data.levelBefore);

  useEffect(() => {
    const timers: number[] = [];
    const t = (ms: number, fn: () => void) =>
      timers.push(window.setTimeout(fn, delay + ms));

    if (!data.leveledUp) {
      t(T_START, () => setWidth(data.progressAfter));
    } else {
      t(T_START, () => setWidth(1));
      t(T_START + T_FILL, () => {
        setShownLevel(data.levelAfter);
        hitRef.current();
        setAnimated(false);
        setWidth(0);
      });
      t(T_START + T_FILL + 60, () => {
        setAnimated(true);
        setWidth(data.progressAfter);
      });
    }

    return () => timers.forEach(window.clearTimeout);
  }, [data, delay]);

  return (
    <div>
      <div className="flex items-center gap-2.5">
        {slug && (
          <span className="icon-disc h-8 w-8">
            <CategoryIcon slug={slug} strokeWidth={1.8} className="h-4 w-4" />
          </span>
        )}
        <span className="text-[15px] font-medium">{title}</span>
        <LevelNumber
          value={shownLevel}
          className={`ml-auto transition-colors ${shownLevel > data.levelBefore ? "text-ink" : ""}`}
        />
      </div>

      <div className="progress mt-3">
        <i
          style={{
            width: `${Math.round(width * 100)}%`,
            transition: animated ? undefined : "none",
          }}
        />
      </div>

      <p className="mt-2 mb-0 text-[12px] text-ink-faint">
        {data.atMaxLevel
          ? data.frozen
            ? "Maestría"
            : "Nivel máximo"
          : `${data.xpToNextLevel} XP para el nivel ${data.levelAfter + 1}`}
      </p>
    </div>
  );
}
