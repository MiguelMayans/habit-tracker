import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  createFocus,
  deleteActivity,
  deleteFocus,
  getActivitiesByCategory,
  getCategory,
  getFocusesByCategory,
  updateFocus,
  type Activity,
  type Category,
  type Focus,
  type Intensity,
} from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { orderByLineage } from "../lib/focusLineage";
import { useLight } from "../lib/useLight";
import { CategoryIcon } from "../components/CategoryIcon";
import { LevelNumber } from "../components/LevelNumber";
import { categoryWordmark } from "../lib/categoryWordmark";
import { isToday, shortRelativeDate } from "../lib/dates";
import { XP_BY_INTENSITY } from "../lib/intensity";
import { useLongPress } from "../lib/useLongPress";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FocusMenu } from "../components/FocusMenu";
import { QuickIntensities } from "../components/QuickIntensities";
import { ResultModal } from "../components/ResultModal";
import { useQuickLog } from "../lib/useQuickLog";
import { ActivityRow } from "../components/ActivityRow";
import { SkeletonCards } from "../components/SkeletonCards";
import { ErrorPanel } from "../components/ErrorPanel";

/** How many activities are listed before cutting off. */
const VISIBLE_HISTORY = 8;

/** Alternating tilt on the focus tiles, for the collage effect. */
const TILTS = ["-0.9deg", "0.7deg", "-0.5deg", "1deg", "-0.7deg"];

/**
 * A focus on the category detail.
 *
 * Tapping it does the same as on the home: an active focus unfolds its three
 * intensities and logs in place; a frozen one — mastered or called done, so
 * the backend would refuse activity — starts its child focus instead, which is
 * the one thing it does accept. It used to navigate to the full form, so the
 * same tap meant "log now" on one screen and "take me somewhere" on the other.
 *
 * Holding it, or its "···" handle, opens the focus menu: renaming, closing,
 * deleting. The handle exists because a long press cannot be discovered by
 * looking, nor reached with a keyboard.
 */
function FocusTile({
  focus: f,
  parent,
  categoryId,
  accent,
  index,
  highlighted,
  expanded,
  busy,
  gain,
  onTap,
  onMenu,
  onPick,
}: {
  focus: Focus;
  parent: Focus | undefined;
  categoryId: number;
  accent: string;
  index: number;
  highlighted: boolean;
  expanded: boolean;
  busy: boolean;
  /** XP just earned on this focus, shown for a moment and then withdrawn. */
  gain: number | null;
  onTap: () => void;
  onMenu: () => void;
  onPick: (intensity: Intensity) => void;
}) {
  const press = useLongPress(onMenu);

  return (
    <li
      className={`category-card anim-card relative ${
        highlighted ? "anim-highlight" : ""
      } ${parent ? "ml-7" : ""}`}
      style={
        {
          "--rotation": TILTS[index % TILTS.length],
          "--delay": `${0.22 + index * 0.06}s`,
        } as React.CSSProperties
      }
    >
      <div style={{ filter: `drop-shadow(6px 6px 0 ${accent})` }}>
        <div className="card-clip bg-black">
          <div className="flex">
            <button
              type="button"
              className="long-pressable block min-w-0 flex-1 text-left"
              aria-expanded={f.frozen ? undefined : expanded}
              {...press}
              onClick={(e) => {
                // The hook swallows the click that ends a long press (it calls
                // preventDefault): if it got this far, it was a short tap.
                press.onClick(e);
                if (!e.defaultPrevented) onTap();
              }}
            >
              <div className="slam-content pt-4 pr-2 pb-3 pl-3.5">
                <h3 className="m-0 pr-10 font-display text-[16px] leading-tight text-bone uppercase">
                  {f.name}
                </h3>

                {parent && (
                  <p className="mt-1 text-[9.5px] font-bold tracking-[0.1em] text-bone/60">
                    ↳ DE {parent.name.toUpperCase()}
                  </p>
                )}

                <div className="xp-bar relative mt-2.5 h-3 overflow-hidden bg-[#242424]">
                  <div
                    className="xp-bar-fill relative h-full"
                    style={
                      {
                        width: `${Math.round(f.progress * 100)}%`,
                        background: f.frozen ? accent : "var(--color-yellow)",
                        "--delay": `${0.42 + index * 0.06}s`,
                      } as React.CSSProperties
                    }
                  />
                </div>

                <div className="mt-2 flex items-center gap-2 text-[9.5px] font-semibold tracking-[0.06em] text-bone/70">
                  <span>{f.currentXp} XP</span>
                  <i className="h-[3px] w-[3px] rotate-45 bg-bone/50" />
                  {f.atMaxLevel ? (
                    <b className="text-yellow">MAESTRÍA</b>
                  ) : f.frozen ? (
                    <b className="text-bone/60">TERMINADO</b>
                  ) : (
                    <span>
                      <b className="text-yellow">{f.xpToNextLevel}</b> AL NV{" "}
                      {f.level + 1}
                    </span>
                  )}
                </div>

                {/* What a tap does on a frozen focus, said on the focus itself
                    rather than in a line of instructions above the list. */}
                {f.frozen && (
                  <span
                    className="mt-2.5 inline-block bg-yellow px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] text-black"
                    style={{ transform: "skewX(-10deg)" }}
                  >
                    <span
                      className="inline-block"
                      style={{ transform: "skewX(10deg)" }}
                    >
                      + ENGENDRAR HIJO
                    </span>
                  </span>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={onMenu}
              aria-label={`Opciones de ${f.name}`}
              className="focus-handle"
            >
              <i />
              <i />
              <i />
            </button>
          </div>

          {expanded && !f.frozen && (
            <div className="slam-content px-3.5 pb-4">
              <QuickIntensities
                categoryId={categoryId}
                focusId={f.id}
                busy={busy}
                onPick={onPick}
              />
            </div>
          )}
        </div>
      </div>

      {/* The level spills over the top edge, like on the home cards. */}
      <span className="slam-content pointer-events-none absolute top-1 right-10 z-20">
        <LevelNumber value={f.level} size={25} tag={false} />
      </span>

      {gain !== null && (
        <span
          className="anim-slam pointer-events-none absolute right-10 bottom-3 z-20 bg-yellow px-1.5 py-0.5 font-display text-[11px] leading-none text-black"
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

export function CategoryDetailPage() {
  const { id } = useParams();
  const categoryId = Number(id);

  const [category, setCategory] = useState<Category | null>(null);
  const [focuses, setFocuses] = useState<Focus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // From the creation form, kept apart from the loading error so a failure to
  // create does not wipe from the screen what had already loaded fine.
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  // The newly created focus is flagged in the list for a moment: appearing at
  // the far end of the scroll is indistinguishable from nothing happening.
  const [newFocusId, setNewFocusId] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Tapping a frozen focus pins it here as the parent; the form below then
  // creates its child instead of a standalone focus.
  const [parentToSpawn, setParentToSpawn] = useState<Focus | null>(null);
  // The creation form stays shut until asked for. You open this screen to see
  // how you are doing; you create a focus every few weeks. A form sitting
  // permanently open between the focuses and the history was charging rent on
  // the common case to serve the rare one.
  //
  // Unless you arrived asking for it: the home's empty tab promises "+ PRIMER
  // FOCO" and used to drop you at the top of this screen, leaving you to
  // scroll and find the form yourself. The initial value is read during
  // render, not set from an effect.
  const [searchParams] = useSearchParams();
  const wantsNewFocus = searchParams.get("new") === "focus";
  const [formOpen, setFormOpen] = useState(wantsNewFocus);
  const deepLinkHandled = useRef(false);
  const parentLinkHandled = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Arriving with ?new=focus scrolls down to the form and puts the cursor in
  // it. It happens once and only moves the DOM: it writes no state.
  useEffect(() => {
    if (deepLinkHandled.current || !wantsNewFocus || !category) return;
    if (!formRef.current) return;

    deepLinkHandled.current = true;
    formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    const t = window.setTimeout(() => nameInputRef.current?.focus(), 350);
    return () => window.clearTimeout(t);
  }, [wantsNewFocus, category]);

  useEffect(() => {
    if (!parentToSpawn) return;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Delayed until the smooth scroll finishes: if keyboard focus lands
    // first, the browser jumps straight to the final position and the
    // animation is lost.
    const t = window.setTimeout(() => nameInputRef.current?.focus(), 350);
    return () => window.clearTimeout(t);
  }, [parentToSpawn]);

  // Deletion by long press.
  const [focusToDelete, setFocusToDelete] = useState<Focus | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Undo a log by long-pressing its row in the history.
  const [activityToUndo, setActivityToUndo] = useState<Activity | null>(
    null,
  );
  const [undoing, setUndoing] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  const loadFocuses = useCallback(async () => {
    setFocuses(await getFocusesByCategory(categoryId));
  }, [categoryId]);

  // Renaming: the only way out of a typo used to be deleting the focus, which
  // also detaches its activities. Disproportionate for one misspelled word.
  const [focusBeingEdited, setFocusBeingEdited] = useState<Focus | null>(null);
  const [editedName, setEditedName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  async function onSaveRename() {
    if (!focusBeingEdited) return;
    setRenameError(null);
    setRenaming(true);

    try {
      await updateFocus(focusBeingEdited.id, { name: editedName });
      setFocusBeingEdited(null);
      await loadFocuses();
    } catch (err) {
      setRenameError((err as Error).message);
    } finally {
      setRenaming(false);
    }
  }

  // The focus whose menu is open (rename / close / delete).
  const [menuFocus, setMenuFocus] = useState<Focus | null>(null);

  // Closing a focus by hand: calling it done before reaching level 20.
  const [focusToClose, setFocusToClose] = useState<Focus | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  async function onToggleClosed(focus: Focus, closed: boolean) {
    setCloseError(null);
    setClosing(true);

    try {
      await updateFocus(focus.id, { frozen: closed });
      setFocusToClose(null);
      setMenuFocus(null);
      await loadFocuses();
    } catch (err) {
      setCloseError((err as Error).message);
    } finally {
      setClosing(false);
    }
  }

  // Derived during render, not in an effect: it depends on nothing external.
  const validId = Number.isInteger(categoryId);

  // Wrapped in useCallback so the retry button can call it too, without
  // duplicating the fetch.
  const load = useCallback(() => {
    if (!validId) return () => {};

    // If you navigate to another category before this response lands, it is
    // discarded: otherwise a slow response could overwrite a newer one.
    let cancelled = false;

    Promise.all([
      getCategory(categoryId),
      getFocusesByCategory(categoryId),
      getActivitiesByCategory(categoryId),
    ])
      .then(([cat, focs, acts]) => {
        if (cancelled) return;
        setCategory(cat);
        setFocuses(focs);
        setActivities(acts);

        // A frozen focus on the home links here with ?parent=<id>: the form
        // opens already set to spawn its child. Once only — this load also
        // runs after every quick log.
        const parentId = Number(searchParams.get("parent"));
        if (!parentLinkHandled.current && parentId) {
          parentLinkHandled.current = true;
          const parent = focs.find((x) => x.id === parentId && x.frozen);
          if (parent) setParentToSpawn(parent);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId, validId, searchParams]);

  useEffect(() => load(), [load]);

  // Logging in place, the same hook the home cards use. After a log (or its
  // undo) everything is reloaded WITHOUT the loading state: the tiles stay
  // mounted, so their bars travel to the new width instead of being reborn
  // there.
  const quick = useQuickLog({ categoryId, onAfterChange: () => load() });

  // The backdrop's rays take the colour of the category you are looking at:
  // entering Mente turns the sky purple. It goes before the early returns for
  // loading and error, because hooks cannot be skipped.
  useLight(category ? categoryColorVar(category.slug) : null);

  // Resetting loading/error lives in the event that causes it (the button),
  // not inside the effect.
  function onRetry() {
    setLoading(true);
    setError(null);
    load();
  }

  async function onCreateFocus(e: React.FormEvent) {
    e.preventDefault();
    setErrorForm(null);
    setCreating(true);

    try {
      const created = await createFocus({
        categoryId,
        name: newName,
        parentFocusId: parentToSpawn?.id,
      });
      setNewName("");
      setParentToSpawn(null);
      // Refreshes just the list, without reloading the page.
      await loadFocuses();
      setNewFocusId(created.id);
    } catch (err) {
      setErrorForm((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function onDeleteFocus() {
    if (!focusToDelete) return;
    setDeleteError(null);
    setDeleting(true);

    try {
      await deleteFocus(focusToDelete.id);
      setFocusToDelete(null);
      // The activities are still there, but with no focus now: both lists are
      // reloaded so the history stops attributing them.
      const [focs, acts] = await Promise.all([
        getFocusesByCategory(categoryId),
        getActivitiesByCategory(categoryId),
      ]);
      setFocuses(focs);
      setActivities(acts);
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  async function onUndoActivity() {
    if (!activityToUndo) return;
    setUndoError(null);
    setUndoing(true);

    try {
      await deleteActivity(activityToUndo.id);
      setActivityToUndo(null);
      // The reverted XP may have changed the category and the focus: all
      // three lists are reloaded so nothing is left holding a stale number.
      const [cat, focs, acts] = await Promise.all([
        getCategory(categoryId),
        getFocusesByCategory(categoryId),
        getActivitiesByCategory(categoryId),
      ]);
      setCategory(cat);
      setFocuses(focs);
      setActivities(acts);
    } catch (err) {
      setUndoError((err as Error).message);
    } finally {
      setUndoing(false);
    }
  }

  if (!validId)
    return (
      <p className="px-6 py-10 text-cuerpo">El id de la categoría no es válido</p>
    );
  if (loading)
    return (
      <div className="px-4 pt-8 pb-32">
        <SkeletonCards n={3} height="96px" />
      </div>
    );
  if (error)
    return (
      <div className="px-4 pt-8 pb-32">
        <ErrorPanel message={error} onRetry={onRetry} />
      </div>
    );
  if (!category) return null;

  const accent = categoryColorVar(category.slug);
  const wordmark = categoryWordmark(category.slug);

  return (
    <div className="px-4 pt-6 pb-32">
      {/* The level shares a row with the back link, in the opposite corner.
          It is the only free space on the screen: the category wordmarks bleed
          to all four edges, so placing it over the header — where it would ask
          to be — would land it on top of the artwork.

          No plaque: the rank badge is its own backing, and at this size it is
          the loudest thing at the top of the screen, as it should be. */}
      <div className="flex items-start justify-between gap-4">
        <Link
          to="/"
          className="anim-row inline-block bg-bone px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-black"
          style={{ transform: "skewX(-10deg)" }}
        >
          <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
            ← CATEGORÍAS
          </span>
        </Link>

        <LevelNumber
          value={category.level}
          size={56}
          className="anim-ribbon mt-1 mr-1 shrink-0"
        />
      </div>

      {/* Header: the same bleed band as the home, but in the category's
          colour, so it is obvious which one you are in. */}
      <header className="relative mt-5 mb-7">
        <div className="relative">
          {/* The band is centred on the title with top + a negative margin
              (half its height): it cannot use translate, because the tilt
              already occupies the transform. This works the same for a tall
              wordmark as for a short one. */}
          <div
            className="bleed-band anim-logo top-1/2 -mt-14 z-0 h-[112px]"
            style={
              {
                "--band-bg": accent,
                "--band-edge": "var(--color-black)",
              } as React.CSSProperties
            }
          />

          {wordmark ? (
            <h1 className="relative z-10 m-0">
              {/* Full width: the wordmark owns this screen and spills out of
                  the band top and bottom, the same as on the home. */}
              <img
                src={wordmark.src}
                alt={category.name}
                width={wordmark.width}
                height={wordmark.height}
                className="block h-auto w-full"
              />
            </h1>
          ) : (
            <div className="relative z-10 flex items-center gap-3 py-6">
              <CategoryIcon
                slug={category.slug}
                strokeWidth={2.4}
                className="h-9 w-9 shrink-0 text-black"
              />
              <h1 className="text-sign m-0 font-display text-[38px] leading-[0.9] text-bone uppercase">
                {category.name}
              </h1>
            </div>
          )}
        </div>
      </header>

      {/* Full-width progress: the level no longer steals half the row from
          the left, so the bar takes the whole width of the screen. */}
      <div
        className="anim-row relative"
        style={{ "--delay": "0.1s" } as React.CSSProperties}
      >
        <div className="xp-bar relative h-4 overflow-hidden bg-[#242424]">
          <div
            className="xp-bar-fill relative h-full bg-yellow"
            style={
              {
                width: `${Math.round(category.progress * 100)}%`,
                "--delay": "0.3s",
              } as React.CSSProperties
            }
          />
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold tracking-[0.06em] text-bone/75">
          <span>{category.currentXp} XP</span>
          <i className="h-[3px] w-[3px] rotate-45 bg-bone/55" />
          <span>
            {category.atMaxLevel ? (
              <b className="text-yellow">NIVEL MÁXIMO</b>
            ) : (
              <>
                <b className="text-yellow">{category.xpToNextLevel}</b> AL NV{" "}
                {category.level + 1}
              </>
            )}
          </span>
        </div>
      </div>

      {/* ---- Focuses ---- */}
      <h2
        className="anim-row mt-10 inline-block bg-yellow px-3 py-1 font-display text-[13px] text-black uppercase"
        style={
          {
            transform: "skewX(-10deg)",
            "--delay": "0.16s",
          } as React.CSSProperties
        }
      >
        <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
          Focos · {focuses.length}
        </span>
      </h2>

      {quick.error && (
        <p className="anim-slam mt-4 bg-cuerpo px-3 py-2 text-[11px] font-bold text-bone">
          {quick.error}
        </p>
      )}

      {focuses.length === 0 ? (
        <p
          className="anim-row mt-4 text-sm text-bone/60"
          style={{ "--delay": "0.2s" } as React.CSSProperties}
        >
          Esta categoría todavía no tiene focos.
        </p>
      ) : (
        <ul className="mt-6 grid gap-5">
          {orderByLineage(focuses).map((f, i) => {
            const parent =
              f.parentFocusId !== null
                ? focuses.find((p) => p.id === f.parentFocusId)
                : undefined;

            if (focusBeingEdited?.id === f.id)
              return (
                // The edit panel REPLACES the tile rather than sitting inside
                // it: inside the tile's button, every tap on the input would
                // also start the long-press timer.
                <li
                  key={f.id}
                  className={`category-card relative ${parent ? "ml-7" : ""}`}
                  style={
                    {
                      "--rotation": TILTS[i % TILTS.length],
                    } as React.CSSProperties
                  }
                >
                  <div style={{ filter: `drop-shadow(6px 6px 0 ${accent})` }}>
                    <div className="card-clip bg-black">
                      <div className="slam-content px-3.5 py-3.5">
                        <div className="field-frame">
                          <input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            autoFocus
                            aria-label="Nuevo nombre del foco"
                            className="field"
                          />
                        </div>
                        {renameError && (
                          <p className="mt-2 text-[10px] font-bold text-cuerpo">
                            {renameError}
                          </p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={onSaveRename}
                            disabled={renaming || editedName.trim() === ""}
                            className="slam-button flex-1"
                          >
                            <span>{renaming ? "Guardando…" : "Guardar"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFocusBeingEdited(null)}
                            className="slam-button flex-1"
                            style={{
                              background: "transparent",
                              color: "var(--color-bone)",
                              boxShadow: "none",
                              border: "2px solid var(--color-bone)",
                            }}
                          >
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );

            return (
              <FocusTile
                key={f.id}
                focus={f}
                parent={parent}
                categoryId={categoryId}
                accent={accent}
                index={i}
                highlighted={f.id === newFocusId}
                expanded={quick.openFocusId === f.id}
                busy={quick.busy}
                gain={quick.gain?.focusId === f.id ? quick.gain.xp : null}
                onTap={() => {
                  if (f.frozen) {
                    setParentToSpawn(f);
                    setFormOpen(true);
                  } else {
                    quick.toggle(f.id);
                  }
                }}
                onMenu={() => {
                  quick.close();
                  setCloseError(null);
                  setMenuFocus(f);
                }}
                onPick={(intensity) => quick.log(f.id, intensity)}
              />
            );
          })}
        </ul>
      )}

      {/* ---- New focus ---- */}
      <form onSubmit={onCreateFocus} className="mt-11" ref={formRef}>
        {/* The heading is the control: the same tab as always, but now it
            opens and closes. Closed it carries a "+", open a "×". */}
        <h2 className="m-0">
          <button
            type="button"
            onClick={() => {
              const next = !formOpen;
              setFormOpen(next);
              if (!next) setParentToSpawn(null);
              if (next) window.setTimeout(() => nameInputRef.current?.focus(), 60);
            }}
            aria-expanded={formOpen}
            aria-controls="new-focus"
            className="anim-row inline-block bg-bone px-3 py-1 font-display text-[13px] text-black uppercase"
            style={
              {
                transform: "skewX(-10deg)",
                "--delay": "0.3s",
              } as React.CSSProperties
            }
          >
            <span
              className="inline-flex items-baseline gap-2"
              style={{ transform: "skewX(10deg)" }}
            >
              <b className="text-[15px] leading-none">{formOpen ? "×" : "+"}</b>
              {parentToSpawn ? "Nuevo foco especializado" : "Nuevo foco"}
            </span>
          </button>
        </h2>

        {formOpen && parentToSpawn && (
          <p className="anim-slam mt-3 flex items-center gap-2 text-[11px] font-semibold text-bone/70">
            <span
              className="bg-yellow px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] text-black"
              style={{ transform: "skewX(-10deg)" }}
            >
              HIJO DE {parentToSpawn.name.toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() => setParentToSpawn(null)}
              className="text-[9.5px] font-bold tracking-[0.16em] text-bone/60 underline"
            >
              CANCELAR
            </button>
          </p>
        )}

        <div
          id="new-focus"
          hidden={!formOpen}
          className="anim-row mt-4 flex items-stretch gap-3"
          style={{ "--delay": "0.34s" } as React.CSSProperties}
        >
          <div className="field-frame flex-1">
            <input
              ref={nameInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={
                parentToSpawn
                  ? `Especialización de "${parentToSpawn.name}"…`
                  : "Arduino, Inglés, Pareja…"
              }
              required
              className="field"
            />
          </div>
          <button
            type="submit"
            disabled={creating || newName.trim() === ""}
            className="slam-button shrink-0"
          >
            <span>
              {creating
                ? "Creando…"
                : parentToSpawn
                  ? "Engendrar"
                  : "Crear"}
            </span>
          </button>
        </div>

        {formOpen && errorForm && (
          <p className="anim-slam mt-4 bg-cuerpo px-3 py-2 text-[11px] font-bold text-bone">
            {errorForm}
          </p>
        )}
      </form>

      {/* ---- History ---- */}
      <h2
        className="anim-row mt-11 inline-block bg-bone px-3 py-1 font-display text-[13px] text-black uppercase"
        style={
          {
            transform: "skewX(-10deg)",
            "--delay": "0.38s",
          } as React.CSSProperties
        }
      >
        <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
          Historial · {activities.length}
        </span>
      </h2>

      {activities.some((a) => isToday(a.date)) && (
        <p
          className="anim-row mt-2 text-[9px] font-bold tracking-[0.16em] text-bone/55"
          style={{ "--delay": "0.4s" } as React.CSSProperties}
        >
          MANTÉN PULSADA UNA ACTIVIDAD DE HOY PARA DESHACERLA
        </p>
      )}

      {activities.length === 0 ? (
        <p
          className="anim-row mt-4 text-sm text-bone/60"
          style={{ "--delay": "0.42s" } as React.CSSProperties}
        >
          Todavía no has registrado nada en esta categoría.
        </p>
      ) : (
        <>
          <ul className="mt-4 grid gap-2.5">
            {activities.slice(0, VISIBLE_HISTORY).map((a, i) => (
              <ActivityRow
                key={a.id}
                activity={a}
                accent={accent}
                focusName={
                  a.focusId !== null
                    ? (focuses.find((f) => f.id === a.focusId)?.name ??
                      "foco borrado")
                    : null
                }
                delay={0.44 + i * 0.04}
                onHold={() => {
                  setUndoError(null);
                  setActivityToUndo(a);
                }}
              />
            ))}
          </ul>

          {activities.length > VISIBLE_HISTORY && (
            <Link
              to={`/categories/${categoryId}/history`}
              className="mt-3 inline-block text-[10px] font-bold tracking-[0.16em] text-yellow underline"
            >
              VER HISTORIAL COMPLETO · Y {activities.length - VISIBLE_HISTORY} MÁS
            </Link>
          )}
        </>
      )}

      {menuFocus && (
        <FocusMenu
          focus={menuFocus}
          accent={accent}
          busy={closing}
          error={closeError}
          onRename={() => {
            setFocusBeingEdited(menuFocus);
            setEditedName(menuFocus.name);
            setRenameError(null);
            setMenuFocus(null);
          }}
          onClose={() => {
            setCloseError(null);
            setFocusToClose(menuFocus);
            setMenuFocus(null);
          }}
          onReopen={() => onToggleClosed(menuFocus, false)}
          onDelete={() => {
            setDeleteError(null);
            setFocusToDelete(menuFocus);
            setMenuFocus(null);
          }}
          onCancel={() => setMenuFocus(null)}
        />
      )}

      {/* Only when a quick log raised a level: see useQuickLog. Rendered at
          page level and not inside the tile, whose drop-shadow filter would
          turn the modal's `position: fixed` into `absolute`. */}
      {quick.result && (
        <ResultModal
          result={quick.result}
          category={category}
          backTo={null}
          onClose={quick.dismissResult}
          onUndo={quick.undo}
        />
      )}

      {focusToClose && (
        <ConfirmDialog
          bandTitle="¿Darlo por terminado?"
          titleId="close-focus-title"
          busy={closing}
          error={closeError}
          confirmLabel="Cerrar"
          busyLabel="Cerrando…"
          onConfirm={() => onToggleClosed(focusToClose, true)}
          onCancel={() => setFocusToClose(null)}
        >
          <p className="m-0 font-display text-[20px] leading-tight text-bone uppercase">
            {focusToClose.name}
          </p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.14em] text-bone/55">
            NIVEL {focusToClose.level} · {focusToClose.currentXp} XP
          </p>

          <p className="mt-4 text-[11.5px] leading-relaxed text-bone/75">
            Dejará de aceptar actividad y podrás{" "}
            <b className="text-yellow">engendrar un hijo</b> desde él, igual
            que si hubiera llegado al nivel 20. Su XP se queda donde está: no
            se pierde nada.
          </p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-bone/55">
            Se puede reabrir cuando quieras.
          </p>
        </ConfirmDialog>
      )}

      {focusToDelete && (
        <ConfirmDialog
          bandTitle="¿Borrar foco?"
          titleId="delete-focus-title"
          busy={deleting}
          error={deleteError}
          confirmLabel="Borrar"
          busyLabel="Borrando…"
          onConfirm={onDeleteFocus}
          onCancel={() => setFocusToDelete(null)}
        >
          <p className="m-0 font-display text-[20px] leading-tight text-bone uppercase">
            {focusToDelete.name}
          </p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.14em] text-bone/55">
            NIVEL {focusToDelete.level} · {focusToDelete.currentXp} XP
          </p>

          <p className="mt-4 text-[11.5px] leading-relaxed text-bone/75">
            {(() => {
              const n = activities.filter(
                (a) => a.focusId === focusToDelete.id,
              ).length;
              if (n === 0) return "No tiene actividades registradas.";
              return (
                <>
                  Sus <b className="text-yellow">{n}</b>{" "}
                  {n === 1 ? "actividad" : "actividades"} no se{" "}
                  {n === 1 ? "borra" : "borran"}: se{" "}
                  {n === 1 ? "queda" : "quedan"} en la categoría sin foco. La
                  XP que {n === 1 ? "te dio sigue" : "te dieron siguen"}{" "}
                  contando.
                </>
              );
            })()}
          </p>
        </ConfirmDialog>
      )}

      {activityToUndo && (
        <ConfirmDialog
          bandTitle="¿Deshacer registro?"
          titleId="undo-activity-title"
          busy={undoing}
          error={undoError}
          confirmLabel="Deshacer"
          busyLabel="Deshaciendo…"
          onConfirm={onUndoActivity}
          onCancel={() => setActivityToUndo(null)}
        >
          <p className="m-0 font-display text-[18px] leading-tight text-bone uppercase">
            {activityToUndo.description === ""
              ? "Sin descripción"
              : activityToUndo.description}
          </p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.14em] text-bone/55">
            +{XP_BY_INTENSITY[activityToUndo.intensity]} XP ·{" "}
            {shortRelativeDate(activityToUndo.date)}
          </p>

          <p className="mt-4 text-[11.5px] leading-relaxed text-bone/75">
            Se le resta esa XP al foco (si la tenía) y a la categoría, y el
            nivel puede bajar si corresponde. Solo puede deshacerse un
            registro de hoy.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
