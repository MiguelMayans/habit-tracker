import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

/**
 * A category's full history, grouped by day. The category detail only shows
 * the last VISIBLE_HISTORY entries; this screen is where "Y N MÁS" leads to
 * see the rest.
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
      <p className="px-6 py-10 text-cuerpo">El id de la categoría no es válido</p>
    );
  if (loading)
    return (
      <div className="px-4 pt-8 pb-32">
        <SkeletonCards n={4} height="72px" />
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
    <div className="px-4 pt-6 pb-32">
      <Link
        to={`/categories/${categoryId}`}
        className="anim-row inline-block bg-bone px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-black"
        style={{ transform: "skewX(-10deg)" }}
      >
        <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
          ← {category.name.toUpperCase()}
        </span>
      </Link>

      <h1
        className="text-sign anim-row mt-6 mb-1 font-display text-[28px] leading-[0.95] text-bone uppercase"
        style={{ "--delay": "0.05s" } as React.CSSProperties}
      >
        Historial
      </h1>
      <p
        className="anim-row mb-8 text-[10px] font-bold tracking-[0.16em] text-bone/55"
        style={{ "--delay": "0.08s" } as React.CSSProperties}
      >
        {activities.length} {activities.length === 1 ? "ACTIVIDAD" : "ACTIVIDADES"} EN
        TOTAL
      </p>

      {activities.length === 0 ? (
        <p className="text-sm text-bone/60">
          Todavía no has registrado nada en esta categoría.
        </p>
      ) : (
        groups.map((g, gi) => (
          <div key={`${g.label}-${gi}`} className="mb-8">
            <p
              className="anim-row mb-2.5 inline-block bg-yellow px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-black"
              style={
                {
                  transform: "skewX(-10deg)",
                  "--delay": `${0.1 + gi * 0.03}s`,
                } as React.CSSProperties
              }
            >
              <span
                className="inline-block"
                style={{ transform: "skewX(10deg)" }}
              >
                {g.label}
              </span>
            </p>
            <ul className="grid gap-2.5">
              {g.items.map((a, i) => (
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
                  delay={0.12 + gi * 0.03 + i * 0.02}
                  onHold={() => {
                    setUndoError(null);
                    setActivityToUndo(a);
                  }}
                />
              ))}
            </ul>
          </div>
        ))
      )}

      {activityToUndo && (
        <ConfirmDialog
          bandTitle="¿Deshacer registro?"
          titleId="undo-history-title"
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
