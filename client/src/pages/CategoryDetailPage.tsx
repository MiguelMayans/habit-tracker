import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  createFocus,
  deleteActivity,
  deleteFocus,
  getActivitiesByCategory,
  getCategory,
  getFocusesByCategory,
  peek,
  peekCategory,
  updateFocus,
  type Activity,
  type Category,
  type Focus,
  type Intensity,
} from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { orderByLineage } from "../lib/focusLineage";
import { CategoryIcon } from "../components/CategoryIcon";
import { LevelNumber } from "../components/LevelNumber";
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
import { BackLink, SectionTitle } from "../components/Layout";
import { Collapse } from "../components/Collapse";
import { vtName } from "../lib/viewTransition";

/** How many activities are listed before cutting off. */
const VISIBLE_HISTORY = 8;

/**
 * A focus on the category detail.
 *
 * Tapping it does the same as on the home: an active focus unfolds its three
 * intensities and logs in place; a frozen one — mastered or called done —
 * starts its child focus instead, the one thing it accepts.
 *
 * Holding it, or its "···" button, opens the focus menu: renaming, closing,
 * deleting. The button exists because a long press cannot be discovered by
 * looking, nor reached with a keyboard.
 */
function FocusTile({
  focus: f,
  parent,
  index,
  highlighted,
  expanded,
  busy,
  gain,
  onTap,
  onMenu,
  onPick,
  categoryId,
}: {
  focus: Focus;
  parent: Focus | undefined;
  categoryId: number;
  index: number;
  highlighted: boolean;
  expanded: boolean;
  busy: boolean;
  /** XP just earned on this focus, shown for a moment. */
  gain: number | null;
  onTap: () => void;
  onMenu: () => void;
  onPick: (intensity: Intensity) => void;
}) {
  const press = useLongPress(onMenu);

  return (
    <li
      className={`card card-tinted settle ${highlighted ? "highlight" : ""} ${parent ? "ml-6" : ""}`}
      style={{ "--delay": `${0.08 + index * 0.04}s` } as React.CSSProperties}
    >
      <div className="flex items-start">
        <button
          type="button"
          className="press-card long-pressable block min-w-0 flex-1 py-4 pl-5 text-left"
          aria-expanded={f.frozen ? undefined : expanded}
          {...press}
          onClick={(e) => {
            // The hook swallows the click that ends a long press: if it got
            // this far, it was a short tap.
            press.onClick(e);
            if (!e.defaultPrevented) onTap();
          }}
        >
          <div className="flex items-baseline gap-2">
            <h3 className="m-0 truncate text-[16px] font-semibold">{f.name}</h3>
            {gain !== null && (
              <span className="gain text-[13px] font-semibold" style={{ color: "var(--accent)" }}>
                +{gain}
              </span>
            )}
            <span className="ml-auto shrink-0">
              {f.atMaxLevel ? (
                <span className="text-[13px] text-ink-soft">Maestría</span>
              ) : f.frozen ? (
                <span className="text-[13px] text-ink-soft">Terminado</span>
              ) : (
                <LevelNumber value={f.level} />
              )}
            </span>
          </div>

          {parent && (
            <p className="mt-0.5 mb-0 text-[12px] text-ink-faint">De {parent.name}</p>
          )}

          <div className="progress mt-3 h-1">
            <i style={{ width: `${Math.round(f.progress * 100)}%` }} />
          </div>

          <p className="mt-2 mb-0 text-[12px] text-ink-faint">
            {f.frozen
              ? "+ Crear un foco hijo"
              : `${f.currentXp} XP · ${f.xpToNextLevel} para el nivel ${f.level + 1}`}
          </p>
        </button>

        <button
          type="button"
          onClick={onMenu}
          aria-label={`Opciones de ${f.name}`}
          className="grid h-12 w-12 shrink-0 place-items-center text-ink-faint"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
            <circle cx="5.5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="18.5" cy="12" r="1.6" />
          </svg>
        </button>
      </div>

      {!f.frozen && (
        <Collapse open={expanded}>
          <div className="px-5 pb-3">
            <QuickIntensities
              categoryId={categoryId}
              focusId={f.id}
              busy={busy}
              onPick={onPick}
            />
          </div>
        </Collapse>
      )}
    </li>
  );
}

export function CategoryDetailPage() {
  const { id } = useParams();
  const categoryId = Number(id);

  // The header paints at once from what the home already knew — which is
  // also what the card's transition lands on — and the lists follow.
  const [category, setCategory] = useState<Category | null>(
    () => peekCategory(categoryId) ?? null,
  );
  const [focuses, setFocuses] = useState<Focus[]>(
    () => peek<Focus[]>(`/categories/${categoryId}/focuses`) ?? [],
  );
  const [loading, setLoading] = useState(
    () =>
      peek(`/categories/${categoryId}/focuses`) === undefined ||
      peek(`/categories/${categoryId}/activities`) === undefined,
  );
  const [error, setError] = useState<string | null>(null);

  // From the creation form, kept apart from the loading error so a failure to
  // create does not wipe from the screen what had already loaded fine.
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  // The newly created focus is flagged in the list for a moment: appearing at
  // the far end of the scroll is indistinguishable from nothing happening.
  const [newFocusId, setNewFocusId] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>(
    () => peek<Activity[]>(`/categories/${categoryId}/activities`) ?? [],
  );

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
      <p className="px-5 py-10 text-warn">El id de la categoría no es válido</p>
    );
  if (loading && !category)
    return (
      <div className="px-5 pt-16 pb-32">
        <div className="skeleton mb-8 h-24" />
        <SkeletonCards n={3} height="96px" />
      </div>
    );
  if (error)
    return (
      <div className="px-5 pt-16 pb-32">
        <ErrorPanel message={error} onRetry={onRetry} />
      </div>
    );
  if (!category) return null;

  const accent = categoryColorVar(category.slug);

  return (
    <div
      className="px-5 pt-6 pb-32"
      style={{ "--accent": accent } as React.CSSProperties}
    >
      <BackLink />

      <header className="card-color mt-5 mb-9 px-5 pt-6 pb-5" style={vtName(`cat-${category.id}`)}>
        <CategoryIcon slug={category.slug} strokeWidth={1.4} className="watermark !h-[190px] !w-[190px]" />

        <div className="relative flex items-start gap-4">
          <span className="icon-solid h-14 w-14" style={vtName(`cat-icon-${category.id}`)}>
            <CategoryIcon slug={category.slug} strokeWidth={1.8} className="h-7 w-7" />
          </span>
          <div className="mt-1.5 flex-1">
            <h1
              className="display m-0 w-fit text-[36px] leading-none"
              style={vtName(`cat-name-${category.id}`)}
            >
              {category.name}
            </h1>
          </div>
          <span className="grid justify-items-end" style={vtName(`cat-level-${category.id}`)}>
            <span className="text-[11px] font-medium tracking-wide text-ink-soft">Nivel</span>
            <b className="level-big text-[52px]">{category.level}</b>
          </span>
        </div>

        <div className="progress relative mt-6 h-2.5">
          <i style={{ width: `${Math.round(category.progress * 100)}%` }} />
        </div>
        <p className="relative mt-2.5 mb-0 text-[13px] text-ink-soft">
          {category.currentXp} XP ·{" "}
          {category.atMaxLevel
            ? "nivel máximo"
            : `${category.xpToNextLevel} para el nivel ${category.level + 1}`}
        </p>
      </header>

      {/* ---- Focuses ---- */}
      <SectionTitle>Focos</SectionTitle>

      {quick.error && (
        <p className="mt-0 mb-4 text-[14px] text-warn">{quick.error}</p>
      )}

      {loading ? (
        <SkeletonCards n={2} height="96px" />
      ) : focuses.length === 0 ? (
        <p className="settle m-0 text-[15px] text-ink-soft">
          Esta categoría todavía no tiene focos.
        </p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {orderByLineage(focuses).map((f, i) => {
            const parent =
              f.parentFocusId !== null
                ? focuses.find((p) => p.id === f.parentFocusId)
                : undefined;

            if (focusBeingEdited?.id === f.id)
              return (
                // The edit panel replaces the tile rather than sitting inside
                // it: inside the tile's button, every tap on the input would
                // also start the long-press timer.
                <li key={f.id} className={`card px-5 py-4 ${parent ? "ml-6" : ""}`}>
                  <input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    autoFocus
                    aria-label="Nuevo nombre del foco"
                    className="field"
                  />
                  {renameError && (
                    <p className="mt-2 mb-0 text-[14px] text-warn">{renameError}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={onSaveRename}
                      disabled={renaming || editedName.trim() === ""}
                      className="btn flex-1"
                    >
                      {renaming ? "Guardando…" : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFocusBeingEdited(null)}
                      className="btn btn-soft flex-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </li>
              );

            return (
              <FocusTile
                key={f.id}
                focus={f}
                parent={parent}
                categoryId={categoryId}
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
      <form onSubmit={onCreateFocus} className="mt-5" ref={formRef}>
        {!formOpen ? (
          <button
            type="button"
            onClick={() => {
              setFormOpen(true);
              window.setTimeout(() => nameInputRef.current?.focus(), 60);
            }}
            aria-expanded={false}
            aria-controls="new-focus"
            className="btn btn-soft w-full"
          >
            + Nuevo foco
          </button>
        ) : (
          <div id="new-focus" className="card settle px-5 py-5">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 className="m-0 text-[16px] font-semibold">
                {parentToSpawn ? "Nuevo foco especializado" : "Nuevo foco"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setParentToSpawn(null);
                }}
                className="link-quiet"
              >
                Cancelar
              </button>
            </div>

            {parentToSpawn && (
              <p className="mt-0 mb-3 text-[13px] text-ink-soft">
                Hijo de <b className="font-semibold text-ink">{parentToSpawn.name}</b>
              </p>
            )}

            <input
              ref={nameInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={
                parentToSpawn
                  ? `Especialización de "${parentToSpawn.name}"…`
                  : "Arduino, inglés, pareja…"
              }
              required
              aria-label="Nombre del foco"
              className="field"
            />

            {errorForm && (
              <p className="mt-3 mb-0 text-[14px] text-warn">{errorForm}</p>
            )}

            <button
              type="submit"
              disabled={creating || newName.trim() === ""}
              className="btn mt-4 w-full"
            >
              {creating ? "Creando…" : "Crear foco"}
            </button>
          </div>
        )}
      </form>

      {/* ---- History ---- */}
      <SectionTitle className="mt-11">Historial</SectionTitle>

      {loading ? (
        <SkeletonCards n={1} height="180px" />
      ) : activities.length === 0 ? (
        <p className="settle m-0 text-[15px] text-ink-soft">
          Todavía no has registrado nada en esta categoría.
        </p>
      ) : (
        <>
          <ul className="card m-0 list-none divide-y divide-line p-0">
            {activities.slice(0, VISIBLE_HISTORY).map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                focusName={
                  a.focusId !== null
                    ? (focuses.find((f) => f.id === a.focusId)?.name ??
                      "foco borrado")
                    : null
                }
                onHold={() => {
                  setUndoError(null);
                  setActivityToUndo(a);
                }}
              />
            ))}
          </ul>

          {activities.some((a) => isToday(a.date)) && (
            <p className="mt-3 mb-0 text-[12px] text-ink-faint">
              Mantén pulsada una actividad de hoy para deshacerla.
            </p>
          )}

          {activities.length > VISIBLE_HISTORY && (
            <Link
              to={`/categories/${categoryId}/history`}
              className="btn btn-soft mt-4 w-full"
            >
              Ver todo el historial ({activities.length})
            </Link>
          )}
        </>
      )}

      {menuFocus && (
        <FocusMenu
          focus={menuFocus}
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

      {/* Only when a quick log raised a level: see useQuickLog. */}
      {quick.result && (
        <ResultModal
          result={quick.result}
          category={category}
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
          confirmLabel="Darlo por terminado"
          busyLabel="Cerrando…"
          onConfirm={() => onToggleClosed(focusToClose, true)}
          onCancel={() => setFocusToClose(null)}
        >
          <p className="m-0 text-[17px] font-semibold">{focusToClose.name}</p>
          <p className="mt-3 mb-0 text-[15px] leading-relaxed text-ink-soft">
            Dejará de aceptar actividad y podrás crear un foco hijo desde él,
            igual que si hubiera llegado al nivel 20. Su XP se queda donde
            está. Se puede reabrir cuando quieras.
          </p>
        </ConfirmDialog>
      )}

      {focusToDelete && (
        <ConfirmDialog
          bandTitle="¿Borrar este foco?"
          titleId="delete-focus-title"
          busy={deleting}
          error={deleteError}
          confirmLabel="Borrar"
          busyLabel="Borrando…"
          onConfirm={onDeleteFocus}
          onCancel={() => setFocusToDelete(null)}
        >
          <p className="m-0 text-[17px] font-semibold">{focusToDelete.name}</p>
          <p className="mt-3 mb-0 text-[15px] leading-relaxed text-ink-soft">
            {(() => {
              const n = activities.filter(
                (a) => a.focusId === focusToDelete.id,
              ).length;
              if (n === 0) return "No tiene actividades registradas.";
              return n === 1
                ? "Su actividad no se borra: se queda en la categoría sin foco, y la XP que te dio sigue contando."
                : `Sus ${n} actividades no se borran: se quedan en la categoría sin foco, y la XP que te dieron sigue contando.`;
            })()}
          </p>
        </ConfirmDialog>
      )}

      {activityToUndo && (
        <ConfirmDialog
          bandTitle="¿Deshacer el registro?"
          titleId="undo-activity-title"
          busy={undoing}
          error={undoError}
          confirmLabel="Deshacer"
          busyLabel="Deshaciendo…"
          onConfirm={onUndoActivity}
          onCancel={() => setActivityToUndo(null)}
        >
          <p className="m-0 text-[17px] font-semibold">
            {activityToUndo.description === ""
              ? "Sin descripción"
              : activityToUndo.description}
          </p>
          <p className="mt-1 mb-0 text-[13px] text-ink-soft">
            +{XP_BY_INTENSITY[activityToUndo.intensity]} XP ·{" "}
            {shortRelativeDate(activityToUndo.date)}
          </p>
          <p className="mt-3 mb-0 text-[15px] leading-relaxed text-ink-soft">
            Se resta esa XP al foco (si lo tenía) y a la categoría, y el nivel
            vuelve a donde estaba si hace falta.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
