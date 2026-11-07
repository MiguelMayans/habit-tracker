import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  getFocusesByCategory,
  type Category,
  type Focus,
  type Intensity,
} from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { sinceLastActivity } from "../lib/dates";
import { useQuickLog } from "../lib/useQuickLog";
import { orderByLineage } from "../lib/focusLineage";
import { CategoryIcon } from "./CategoryIcon";
import { LevelNumber } from "./LevelNumber";
import { QuickIntensities } from "./QuickIntensities";
import { ResultModal } from "./ResultModal";

/**
 * A category on the home: its icon, name, level and a thin bar, and its
 * focuses folded underneath.
 *
 * The link to the detail does not wrap the whole card: the focus toggle is a
 * button, and a button inside a link is not valid HTML. So the link covers
 * the head and the bar, and the focuses are its siblings.
 */
export function CategoryCard({
  category: c,
  index: i,
  onLogged,
}: {
  category: Category;
  index: number;
  /** Refreshes the home's data after logging from inside the card. */
  onLogged: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focuses, setFocuses] = useState<Focus[] | null>(null);
  const [loadingFocuses, setLoadingFocuses] = useState(false);
  const [focusesError, setFocusesError] = useState<string | null>(null);

  // Quick logging lives in a hook shared with the category detail: the same
  // gesture has to mean the same thing in both places.
  const quick = useQuickLog({
    categoryId: c.id,
    onAfterChange: () => {
      loadFocuses(true);
      onLogged();
    },
  });

  const accent = categoryColorVar(c.slug);
  const last = sinceLastActivity(c.lastActivityAt);
  const panelId = `category-focuses-${c.id}`;

  /**
   * `silent` reloads without the skeleton, so the rows stay mounted and their
   * bars travel to the new width instead of being reborn there.
   */
  function loadFocuses(silent = false) {
    if (!silent) setLoadingFocuses(true);
    setFocusesError(null);
    getFocusesByCategory(c.id)
      .then((f) => setFocuses(orderByLineage(f)))
      .catch((e: Error) => setFocusesError(e.message))
      .finally(() => {
        if (!silent) setLoadingFocuses(false);
      });
  }

  // Focuses are fetched the first time you open, not when the home loads.
  function onToggle() {
    const next = !isOpen;
    setIsOpen(next);
    quick.close();
    if (next && focuses === null && !loadingFocuses) loadFocuses();
  }

  return (
    <li
      className="card-color settle"
      style={
        { "--accent": accent, "--delay": `${0.05 + i * 0.05}s` } as React.CSSProperties
      }
    >
      <CategoryIcon slug={c.slug} strokeWidth={1.4} className="watermark" />

      <Link to={`/categories/${c.id}`} className="press-card relative block px-5 pt-5 pb-4">
        <div className="flex items-start gap-3.5">
          <span className="icon-solid mt-0.5 h-11 w-11">
            <CategoryIcon slug={c.slug} strokeWidth={1.9} className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="display m-0 text-[24px] leading-tight">{c.name}</h2>
            <p
              className={`mt-0.5 mb-0 text-[13px] ${last.cold ? "font-medium text-warn" : "text-ink-soft"}`}
            >
              {last.text}
            </p>
          </div>
          <span className="grid justify-items-end">
            <span className="text-[11px] font-medium tracking-wide text-ink-soft">Nivel</span>
            <b className="level-big text-[40px]">{c.level}</b>
          </span>
        </div>

        <div className="progress mt-4 h-2">
          <i style={{ width: `${Math.round(c.progress * 100)}%` }} />
        </div>
        <p className="mt-2 mb-0 text-[12px] text-ink-soft">
          {c.atMaxLevel
            ? "Nivel máximo"
            : `${c.xpToNextLevel} XP para el nivel ${c.level + 1}`}
        </p>
      </Link>

      {c.focusCount === 0 ? (
        <Link
          to={`/categories/${c.id}?new=focus`}
          className="relative flex items-center gap-1.5 border-t border-ink/8 px-5 py-3.5 text-[14px] font-medium text-ink-soft"
        >
          <span className="text-[17px] leading-none">+</span> Añadir un foco
        </Link>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="relative flex w-full items-center gap-2 border-t border-ink/8 px-5 py-3.5 text-left text-[14px] font-medium text-ink-soft"
        >
          {c.focusCount} {c.focusCount === 1 ? "foco" : "focos"}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`ml-auto h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div id={panelId} className="relative px-5 pb-5">
          {loadingFocuses && (
            <div className="grid gap-3 pt-1" aria-label="Cargando focos">
              <div className="skeleton h-10 rounded-xl" />
              <div className="skeleton h-10 rounded-xl" />
            </div>
          )}

          {focusesError && (
            <p className="m-0 text-[14px] text-warn">
              {focusesError}{" "}
              <button type="button" onClick={() => loadFocuses()} className="link-quiet">
                Reintentar
              </button>
            </p>
          )}

          {quick.error && (
            <p className="mt-0 mb-3 text-[14px] text-warn">{quick.error}</p>
          )}

          {focuses && !loadingFocuses && !focusesError && (
            <ul className="m-0 grid list-none gap-1 p-0">
              {focuses.map((f, j) => (
                <HomeFocusRow
                  key={f.id}
                  focus={f}
                  categoryId={c.id}
                  isChild={f.parentFocusId !== null}
                  delay={j * 0.03}
                  expanded={quick.openFocusId === f.id}
                  busy={quick.busy}
                  onExpand={() => quick.toggle(f.id)}
                  onPick={(intensity) => quick.log(f.id, intensity)}
                  gain={quick.gain?.focusId === f.id ? quick.gain.xp : null}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Only appears when the log raised a level: see useQuickLog. */}
      {quick.result &&
        createPortal(
          <ResultModal
            result={quick.result}
            category={c}
            onClose={quick.dismissResult}
            onUndo={quick.undo}
          />,
          document.body,
        )}
    </li>
  );
}

/**
 * A focus inside the card. Tapping it unfolds the three intensities right
 * here, and picking one logs it: two taps, no navigation. A frozen focus
 * (mastered or closed) takes no activity, so it leads to spawning its child.
 */
function HomeFocusRow({
  focus: f,
  categoryId,
  isChild,
  delay,
  expanded,
  busy,
  onExpand,
  onPick,
  gain,
}: {
  focus: Focus;
  categoryId: number;
  isChild: boolean;
  delay: number;
  expanded: boolean;
  busy: boolean;
  onExpand: () => void;
  onPick: (intensity: Intensity) => void;
  /** XP just earned on this focus, shown for a moment. */
  gain: number | null;
}) {
  const head = (
    <>
      <div className="flex items-baseline gap-2">
        <span className="truncate text-[15px] font-medium">{f.name}</span>
        {gain !== null && (
          <span className="gain text-[13px] font-semibold" style={{ color: "var(--accent)" }}>
            +{gain}
          </span>
        )}
        <span className="ml-auto shrink-0 text-[12px] text-ink-soft">
          {f.atMaxLevel ? "Maestría" : f.frozen ? "Terminado" : <LevelNumber value={f.level} />}
        </span>
      </div>
      <div className="progress mt-2 h-1">
        <i style={{ width: `${Math.round(f.progress * 100)}%` }} />
      </div>
    </>
  );

  return (
    <li
      className={`settle ${isChild ? "ml-4 border-l border-line pl-3" : ""}`}
      style={{ "--delay": `${delay}s` } as React.CSSProperties}
    >
      {f.frozen ? (
        <Link
          to={`/categories/${categoryId}?new=focus&parent=${f.id}`}
          className="block rounded-xl py-2.5"
          aria-label={`${f.name}: crear un foco hijo`}
        >
          {head}
          <p className="mt-1.5 mb-0 text-[12px] text-ink-soft">+ Crear un foco hijo</p>
        </Link>
      ) : (
        <button
          type="button"
          onClick={onExpand}
          aria-expanded={expanded}
          className="block w-full rounded-xl py-2.5 text-left"
        >
          {head}
        </button>
      )}

      {expanded && !f.frozen && (
        <QuickIntensities
          categoryId={categoryId}
          focusId={f.id}
          busy={busy}
          onPick={onPick}
        />
      )}
    </li>
  );
}
