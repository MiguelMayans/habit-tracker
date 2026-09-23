import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
} from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { useLight } from "../lib/useLight";
import { CategoryIcon } from "../components/CategoryIcon";
import { categoryWordmark } from "../lib/categoryWordmark";
import { isToday, shortRelativeDate } from "../lib/dates";
import { XP_BY_INTENSITY } from "../lib/intensity";
import { useLongPress } from "../lib/useLongPress";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ActivityRow } from "../components/ActivityRow";
import { SkeletonCards } from "../components/SkeletonCards";
import { ErrorPanel } from "../components/ErrorPanel";

/** How many activities are listed before cutting off. */
const VISIBLE_HISTORY = 8;

/** Alternating tilt on the focus tiles, for the collage effect. */
const TILTS = ["-0.9deg", "0.7deg", "-0.5deg", "1deg", "-0.7deg"];

/**
 * Tapping a focus leads to logging activity ON that focus, with the category
 * and focus already chosen.
 *
 * A frozen focus is not linked: it is at the maximum level and the backend
 * would reject the activity. Instead, a short tap spawns its child focus —
 * the same gesture that logs on an active focus leads here to the one action
 * it DOES accept. A long press still deletes in both cases.
 */
function FocusTile({
  frozen,
  categoryId,
  focusId,
  onHold,
  onSpawn,
  children,
}: {
  frozen: boolean;
  categoryId: number;
  focusId: number;
  onHold: () => void;
  onSpawn: () => void;
  children: React.ReactNode;
}) {
  const press = useLongPress(onHold);

  if (frozen) {
    return (
      <div
        className="long-pressable block"
        role="button"
        tabIndex={0}
        {...press}
        onClick={(e) => {
          // The hook already swallows the click when the long press is what
          // fired (it calls preventDefault): if it got this far, it really was
          // a short tap.
          press.onClick(e);
          if (!e.defaultPrevented) onSpawn();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSpawn();
          }
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <Link
      to={`/log-activity?category=${categoryId}&focus=${focusId}`}
      className="long-pressable block"
      {...press}
    >
      {children}
    </Link>
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
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

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
  }, [categoryId, validId]);

  useEffect(() => load(), [load]);

  // The scene's beam takes the colour of the category you are looking at:
  // entering Cuerpo tints the room red. It goes before the early returns for
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

          The bone plaque is what gives it force: yellow on black dissolves
          among the other yellow things, while on white, with the lettering's
          black outline, it lifts off. The hard shadow takes the category
          colour, because a black one on a black background would be
          invisible. */}
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

        <span
          className="anim-ribbon flex shrink-0 items-center gap-2.5 bg-bone py-1.5 pr-4 pl-3.5"
          style={{
            transform: "skewX(-10deg)",
            boxShadow: `7px 7px 0 ${accent}`,
          }}
        >
          <span
            className="inline-block text-[10px] font-bold tracking-[0.2em] text-black"
            style={{ transform: "skewX(10deg)" }}
          >
            NIVEL
          </span>
          <b
            className="text-sign-fine inline-block font-display text-[56px] leading-[0.78] text-yellow"
            style={{ transform: "skewX(10deg)" }}
          >
            {category.level}
          </b>
        </span>
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

      {focuses.length > 0 && (
        <p
          className="anim-row mt-2 text-[9px] font-bold tracking-[0.16em] text-bone/40"
          style={{ "--delay": "0.18s" } as React.CSSProperties}
        >
          PULSA PARA REGISTRAR
          {focuses.some((f) => f.frozen) &&
            " · PULSA UN CERRADO PARA ENGENDRAR HIJO"}{" "}
          · MANTÉN PULSADO PARA BORRAR
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
        <ul className="mt-4 grid gap-3.5">
          {focuses.map((f, i) => {
            const parent =
              f.parentFocusId !== null
                ? focuses.find((p) => p.id === f.parentFocusId)
                : undefined;

            return (
              <li
                key={f.id}
                className={`category-card anim-card relative ${
                  f.id === newFocusId ? "anim-highlight" : ""
                } ${parent ? "ml-7" : ""}`}
                style={
                  {
                    "--rotation": TILTS[i % TILTS.length],
                    "--delay": `${0.22 + i * 0.06}s`,
                  } as React.CSSProperties
                }
              >
                {focusBeingEdited?.id === f.id ? (
                  // The edit panel REPLACES the whole FocusTile rather than
                  // sitting inside it: wrapped in its container (a Link or the
                  // long press), any tap on the input would also start the
                  // long-press timer.
                  <div
                    className="card-clip bg-black"
                    style={{ filter: `drop-shadow(6px 6px 0 ${accent})` }}
                  >
                    <div className="slam-content px-3.5 py-3.5">
                      <div className="field-frame">
                        <input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          autoFocus
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
                ) : (
                  <>
                    <div className="absolute top-1.5 right-2 z-30 flex gap-2.5 text-[9px] font-bold tracking-[0.14em] text-bone/45">
                      <button
                        type="button"
                        onClick={() => {
                          setFocusBeingEdited(f);
                          setEditedName(f.name);
                          setRenameError(null);
                        }}
                        className="underline"
                      >
                        editar
                      </button>
                      {/* Mastery does not reopen: it was earned. A manual
                          close does, because it is a decision, and decisions
                          change. */}
                      {f.atMaxLevel ? null : f.frozen ? (
                        <button
                          type="button"
                          onClick={() => onToggleClosed(f, false)}
                          disabled={closing}
                          className="text-yellow underline"
                        >
                          reabrir
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCloseError(null);
                            setFocusToClose(f);
                          }}
                          className="underline"
                        >
                          cerrar
                        </button>
                      )}
                    </div>
                    <FocusTile
                      frozen={f.frozen}
                      categoryId={categoryId}
                      focusId={f.id}
                      onHold={() => {
                        setDeleteError(null);
                        setFocusToDelete(f);
                      }}
                      onSpawn={() => setParentToSpawn(f)}
                    >
                      <div
                        className="card-clip bg-black"
                        style={{ filter: `drop-shadow(6px 6px 0 ${accent})` }}
                      >
                        <div className="slam-content px-3.5 pt-3 pb-3.5">
                        <div className="flex items-center gap-2.5">
                          <h3 className="m-0 font-display text-[17px] leading-none text-bone uppercase">
                            {f.name}
                          </h3>
                          {f.frozen && (
                            // Frozen at the maximum level is mastery; below
                            // it, the only way in is a manual close. There is
                            // no need to store which of the two it was.
                            <span
                              className="px-2 py-0.5 text-[8px] font-bold tracking-[0.18em]"
                              style={{
                                transform: "skewX(-10deg)",
                                background: f.atMaxLevel
                                  ? "var(--color-yellow)"
                                  : "transparent",
                                color: f.atMaxLevel
                                  ? "var(--color-black)"
                                  : "var(--color-bone)",
                                boxShadow: f.atMaxLevel
                                  ? undefined
                                  : "inset 0 0 0 1.5px rgb(245 245 240 / 0.45)",
                              }}
                            >
                              {f.atMaxLevel ? "MAESTRÍA" : "CERRADO"}
                            </span>
                          )}
                          <span className="ml-auto flex items-baseline gap-1 text-[9px] font-bold tracking-[0.16em] text-bone/70">
                            NV{" "}
                            <b className="font-display text-[16px] tracking-normal text-bone">
                              {f.level}
                            </b>
                          </span>
                        </div>

                        {parent && (
                          <p className="mt-1 text-[9px] font-bold tracking-[0.1em] text-bone/45">
                            ↳ DE {parent.name}
                          </p>
                        )}

                        <div className="xp-bar relative mt-2.5 h-3 overflow-hidden bg-[#242424]">
                          <div
                            className="xp-bar-fill relative h-full"
                            style={
                              {
                                width: `${Math.round(f.progress * 100)}%`,
                                background: f.frozen ? accent : "var(--color-yellow)",
                                "--delay": `${0.42 + i * 0.06}s`,
                              } as React.CSSProperties
                            }
                          />
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-[9.5px] font-semibold tracking-[0.06em] text-bone/70">
                          <span>{f.currentXp} XP</span>
                          <i className="h-[3px] w-[3px] rotate-45 bg-bone/50" />
                          <span>
                            {f.atMaxLevel ? (
                              <b className="text-yellow">MAESTRÍA · NV 20</b>
                            ) : f.frozen ? (
                              <b className="text-bone/60">DADO POR TERMINADO</b>
                            ) : (
                              <>
                                <b className="text-yellow">{f.xpToNextLevel}</b> AL NV{" "}
                                {f.level + 1}
                              </>
                            )}
                          </span>
                          {f.frozen && (
                            <span className="ml-auto text-[9px] font-bold tracking-[0.1em] text-yellow">
                              TOCA PARA ENGENDRAR ↴
                            </span>
                          )}
                          </div>
                        </div>
                      </div>
                    </FocusTile>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* ---- New focus ---- */}
      <form onSubmit={onCreateFocus} className="mt-11" ref={formRef}>
        <h2
          className="anim-row inline-block bg-bone px-3 py-1 font-display text-[13px] text-black uppercase"
          style={
            {
              transform: "skewX(-10deg)",
              "--delay": "0.3s",
            } as React.CSSProperties
          }
        >
          <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
            {parentToSpawn ? "Nuevo foco especializado" : "Nuevo foco"}
          </span>
        </h2>

        {parentToSpawn && (
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
              className="text-bone/50 underline"
            >
              cancelar
            </button>
          </p>
        )}

        <div
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

        {errorForm && (
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
          className="anim-row mt-2 text-[9px] font-bold tracking-[0.16em] text-bone/40"
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
