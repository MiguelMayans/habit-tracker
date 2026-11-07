import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  deleteActivity,
  getActivitiesByCategory,
  getCategory,
  getFocusesByCategory,
  type Activity,
  type Category,
  type Focus,
} from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { shortRelativeDate } from "../lib/dates";
import { ActivityRow } from "../components/ActivityRow";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { XP_BY_INTENSITY } from "../lib/intensity";
import { SkeletonCards } from "../components/SkeletonCards";
import { ErrorPanel } from "../components/ErrorPanel";
import { BackLink, SectionTitle } from "../components/Layout";

/**
 * A category's full history, grouped by day. The category detail only shows
 * the last VISIBLE_HISTORY entries; this screen shows the rest.
 */
export function CategoryHistoryPage() {
  const { id } = useParams();
  const categoryId = Number(id);
  const validId = Number.isInteger(categoryId);

  const [category, setCategory] = useState<Category | null>(null);
  const [focuses, setFocuses] = useState<Focus[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Undo by long press, the same as in the category detail.
  const [activityToUndo, setActivityToUndo] = useState<Activity | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!validId) return;

    Promise.all([
      getCategory(categoryId),
      getFocusesByCategory(categoryId),
      getActivitiesByCategory(categoryId),
    ])
      .then(([cat, focs, acts]) => {
        setCategory(cat);
        setFocuses(focs);
        setActivities(acts);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [categoryId, validId]);

  useEffect(() => {
    load();
  }, [load]);

  // Resetting loading/error lives in the event that causes it (the button),
  // not inside the effect.
  function onRetry() {
    setLoading(true);
    setError(null);
    load();
  }

  async function onUndoActivity() {
    if (!activityToUndo) return;
    setUndoError(null);
    setUndoing(true);

    try {
      await deleteActivity(activityToUndo.id);
      setActivityToUndo(null);
      // Only the list needs reloading: the category's level and XP are not
      // shown on this screen.
      setActivities(await getActivitiesByCategory(categoryId));
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
  if (loading)
    return (
      <div className="px-5 pt-16 pb-32">
        <SkeletonCards n={3} height="160px" />
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

  // Grouped by calendar day. The list already arrives sorted by date
  // descending (getActivitiesByCategory), so grouping is just a matter of
  // spotting when the label changes from the previous group.
  const groups: { label: string; items: Activity[] }[] = [];
  for (const a of activities) {
    const label = shortRelativeDate(a.date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(a);
    } else {
      groups.push({ label, items: [a] });
    }
  }

  return (
    <div
      className="px-5 pt-6 pb-32"
      style={{ "--accent": accent } as React.CSSProperties}
    >
      <BackLink to={`/categories/${categoryId}`} label={category.name} />

      <h1 className="settle mt-6 mb-1 text-[30px] leading-tight font-semibold">
        Historial
      </h1>
      <p className="settle mt-0 mb-8 text-[14px] text-ink-soft">
        {activities.length} {activities.length === 1 ? "actividad" : "actividades"} en total
      </p>

      {activities.length === 0 ? (
        <p className="m-0 text-[15px] text-ink-soft">
          Todavía no has registrado nada en esta categoría.
        </p>
      ) : (
        groups.map((g, gi) => (
          <section key={`${g.label}-${gi}`} className="mb-7">
            <SectionTitle>{g.label}</SectionTitle>
            <ul
              className="card settle m-0 list-none divide-y divide-line p-0"
              style={{ "--delay": `${gi * 0.04}s` } as React.CSSProperties}
            >
              {g.items.map((a) => (
                <ActivityRow
                  key={a.id}
                  activity={a}
                  focusName={
                    a.focusId !== null
                      ? (focuses.find((f) => f.id === a.focusId)?.name ??
                        "foco borrado")
                      : null
                  }
                  showDate={false}
                  onHold={() => {
                    setUndoError(null);
                    setActivityToUndo(a);
                  }}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      {activityToUndo && (
        <ConfirmDialog
          bandTitle="¿Deshacer el registro?"
          titleId="undo-history-title"
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
