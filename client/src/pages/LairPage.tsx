import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  createWork,
  deleteActivity,
  deleteWork,
  getCategories,
  peek,
  getWorks,
  logWorkSession,
  updateWork,
  type Category,
  type Intensity,
  type RegisterActivityResult,
  type Work,
  type WorkFields,
  type WorkKind,
} from "../api/client";
import { cue } from "../lib/sound";
import { showToast } from "../lib/toast";
import { haptic } from "../lib/haptics";
import { withViewTransition } from "../lib/viewTransition";
import { KIND_COLOR, KIND_LABEL, WORK_KINDS } from "../lib/works";
import {
  ActiveWorkCard,
  QueuedWorkRow,
  TrophyTile,
} from "../components/WorkCards";
import { WorkSheet } from "../components/WorkSheet";
import { FinishDialog } from "../components/FinishDialog";
import { WorkKindIcon } from "../components/WorkIcons";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ResultModal } from "../components/ResultModal";
import { SkeletonCards } from "../components/SkeletonCards";
import { ErrorPanel } from "../components/ErrorPanel";
import { StaleNotice } from "../components/StaleNotice";
import { useOnReturn } from "../lib/useOnReturn";
import { SectionTitle } from "../components/Layout";

const MENTE = "var(--color-mente)";

/** Newest first; null (never) last. */
const desc = (a: string | null, b: string | null) =>
  a === b ? 0 : a === null ? 1 : b === null ? -1 : a < b ? 1 : -1;

/**
 * A section's works, grouped by kind — books with books, games with games —
 * in the filter chips' order, each under a clear heading. With a filter on
 * there is only one kind, and the headings would only repeat it.
 */
function KindGroups({
  works,
  grouped,
  listClassName,
  render,
}: {
  works: Work[];
  grouped: boolean;
  listClassName: string;
  /** `index` runs across the whole section, for the staggered entrance. */
  render: (work: Work, index: number) => ReactNode;
}) {
  if (!grouped) {
    return <ul className={listClassName}>{works.map(render)}</ul>;
  }

  let index = 0;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {WORK_KINDS.map((kind) => {
        const items = works.filter((w) => w.kind === kind);
        if (items.length === 0) return null;
        return (
          <div key={kind}>
            {/* A real heading, not a caption: it is what sorts the screen. */}
            <h3
              className="settle m-0 mb-3 flex items-center gap-2"
              style={{ "--accent": KIND_COLOR[kind] } as React.CSSProperties}
            >
              <span className="icon-solid h-7 w-7">
                <WorkKindIcon kind={kind} className="h-4 w-4" />
              </span>
              <span className="text-[15px] font-semibold">{KIND_LABEL[kind].many}</span>
              <span className="text-[14px] text-ink-faint">{items.length}</span>
            </h3>
            <ul className={listClassName}>
              {items.map((w) => render(w, index++))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The Lair: the games, books, series, films, anime and comics you have going,
 * the ones waiting their turn, and a shelf of the finished. Its sessions are
 * Mente's XP — conscious leisure (docs/DESIGN.md) — so Mente's lavender is
 * this screen's accent.
 */
export function LairPage() {
  // Painted from the last answer when there is one, refreshed underneath.
  const [works, setWorks] = useState<Work[]>(() => peek<Work[]>("/works") ?? []);
  const [categories, setCategories] = useState<Category[]>(
    () => peek<Category[]>("/categories") ?? [],
  );
  const [loading, setLoading] = useState(
    () => peek("/works") === undefined || peek("/categories") === undefined,
  );
  const [error, setError] = useState<string | null>(null);


  const load = useCallback(() => {
    Promise.all([getWorks(), getCategories()])
      .then(([ws, cats]) => {
        setWorks(ws);
        setCategories(cats);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Back after a while: due dates and progress may have moved on.
  useOnReturn(load);

  function onRetry() {
    // With something already on screen, retrying keeps it there.
    if (works.length === 0) setLoading(true);
    setError(null);
    load();
  }

  const replace = (w: Work) =>
    setWorks((prev) => prev.map((x) => (x.id === w.id ? w : x)));

  const [filter, setFilter] = useState<WorkKind | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  // Sessions: the same two taps as a focus on the home.
  const [sessionOpen, setSessionOpen] = useState<number | null>(null);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [gain, setGain] = useState<{ id: number; xp: number } | null>(null);
  const [result, setResult] = useState<RegisterActivityResult | null>(null);

  // The +XP withdraws itself, cancelled if you leave first.
  useEffect(() => {
    if (!gain) return;
    const t = window.setTimeout(() => setGain(null), 1800);
    return () => window.clearTimeout(t);
  }, [gain]);

  async function onSession(w: Work, intensity: Intensity) {
    setRowError(null);
    setSessionBusy(true);
    try {
      const res = await logWorkSession(w.id, intensity);
      cue("earn");
      replace(res.work);
      setSessionOpen(null);
      setGain({ id: w.id, xp: res.activity.xpGained });
      if (res.activity.category.leveledUp) {
        setResult(res.activity);
      } else {
        const { lastSessionAt } = w;
        showToast({
          message: `+${res.activity.xpGained} XP en Mente`,
          action: {
            label: "Deshacer",
            run: async () => {
              await deleteActivity(res.activity.activity.id);
              setGain(null);
              replace(await updateWork(w.id, { lastSessionAt }));
            },
          },
        });
      }
    } catch (err) {
      setRowError((err as Error).message);
    } finally {
      setSessionBusy(false);
    }
  }

  // Finishing: the rating first, then the stamp, then off to the case.
  const [toFinish, setToFinish] = useState<Work | null>(null);
  const [finishing, setFinishing] = useState<number | null>(null);

  async function onFinish(w: Work, rating: number | null) {
    setToFinish(null);
    setRowError(null);
    setSessionOpen(null);
    setFinishing(w.id);
    try {
      const updated = await updateWork(w.id, { status: "done", rating });
      cue("done");
      // The card flies to its place on the shelf of finished things.
      withViewTransition(() => replace(updated));
      showToast({
        message: "A Terminados",
        action: {
          label: "Deshacer",
          run: async () => {
            const back = await updateWork(w.id, { status: "active", rating: null });
            withViewTransition(() => replace(back));
          },
        },
      });
    } catch (err) {
      setRowError((err as Error).message);
    } finally {
      setFinishing(null);
    }
  }

  // The dots answer the tap at once; the request follows, and a failure
  // puts the old value back.
  async function onPercent(w: Work, percent: number) {
    setRowError(null);
    haptic(6);
    replace({ ...w, percent });
    try {
      replace(await updateWork(w.id, { percent }));
    } catch (err) {
      replace(w);
      setRowError((err as Error).message);
    }
  }

  const [startingId, setStartingId] = useState<number | null>(null);

  async function onStart(w: Work) {
    setRowError(null);
    setStartingId(w.id);
    try {
      const started = await updateWork(w.id, { status: "active" });
      withViewTransition(() => replace(started));
    } catch (err) {
      setRowError((err as Error).message);
    } finally {
      setStartingId(null);
    }
  }

  // Adding and editing: `undefined` is closed, `null` is a new one.
  const [editing, setEditing] = useState<Work | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Work | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openSheet(w: Work | null) {
    setSaveError(null);
    setEditing(w);
  }

  async function onSave(fields: WorkFields & { kind: WorkKind; title: string }) {
    setSaveError(null);
    setSaving(true);
    try {
      if (editing) {
        const saved = await updateWork(editing.id, fields);
        withViewTransition(() => replace(saved));
      } else {
        const w = await createWork(fields);
        withViewTransition(() => setWorks((prev) => [...prev, w]));
      }
      setEditing(undefined);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onConfirmDelete() {
    if (!toDelete) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteWork(toDelete.id);
      withViewTransition(() =>
        setWorks((prev) => prev.filter((x) => x.id !== toDelete.id)),
      );
      setToDelete(null);
      setEditing(undefined);
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading)
    return (
      <div className="px-5 pt-16 pb-32">
        <SkeletonCards n={3} height="150px" />
      </div>
    );
  if (error && works.length === 0)
    return (
      <div className="px-5 pt-16 pb-32">
        <ErrorPanel message={error} onRetry={onRetry} />
      </div>
    );

  const mente = categories.find((c) => c.slug === "mente") ?? null;
  const shown = filter ? works.filter((w) => w.kind === filter) : works;
  const active = shown
    .filter((w) => w.status === "active")
    .sort(
      (a, b) =>
        desc(a.lastSessionAt, b.lastSessionAt) || desc(a.startedAt, b.startedAt),
    );
  const queued = shown.filter((w) => w.status === "queued");
  const done = shown
    .filter((w) => w.status === "done")
    .sort((a, b) => desc(a.finishedAt, b.finishedAt));
  const kindsInUse = new Set(works.map((w) => w.kind));

  return (
    <div
      className="px-5 pt-10 pb-32"
      style={{ "--accent": MENTE } as React.CSSProperties}
    >
      <header className="settle mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="display m-0 text-[34px] leading-tight">Refugio</h1>
          <p className="mt-1 mb-0 text-[14px] text-ink-soft">
            Lo que juegas, lees y ves.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openSheet(null)}
          aria-label="Añadir al refugio"
          className="btn h-11 min-h-0 w-11 shrink-0 px-0"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </header>

      {/* Filtering by kind only once there is more than one to tell apart:
          with a single kind, a row of chips would filter nothing. */}
      {kindsInUse.size > 1 && (
        <div className="settle mb-7 flex flex-wrap gap-1.5">
          <button
            type="button"
            className="chip chip-sm"
            aria-pressed={filter === null}
            onClick={() => setFilter(null)}
          >
            Todo
          </button>
          {WORK_KINDS.filter((k) => kindsInUse.has(k)).map((k) => (
            <button
              key={k}
              type="button"
              className="chip chip-sm"
              aria-pressed={filter === k}
              onClick={() => setFilter(filter === k ? null : k)}
            >
              <WorkKindIcon kind={k} className="h-4 w-4" />
              {KIND_LABEL[k].many}
            </button>
          ))}
        </div>
      )}

      {error && <StaleNotice message={error} onRetry={onRetry} />}
      {rowError && <p className="mt-0 mb-6 text-[14px] text-warn">{rowError}</p>}

      {works.length === 0 && (
        <div className="settle py-8 text-center">
          <p className="m-0 text-[18px] font-semibold">Tu refugio está vacío</p>
          <p className="mt-1.5 mb-5 text-[15px] text-ink-soft">
            Añade lo que estés jugando, leyendo o viendo.
          </p>
          <button type="button" onClick={() => openSheet(null)} className="btn btn-soft">
            Añadir algo
          </button>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-9">
          <SectionTitle count={active.length} className="mb-4 text-[20px]">En curso</SectionTitle>
          <KindGroups
            works={active}
            grouped={filter === null}
            listClassName="poster-row"
            render={(w) => (
              <ActiveWorkCard
                key={w.id}
                work={w}
                menteId={mente?.id ?? null}
                open={sessionOpen === w.id}
                busy={sessionBusy}
                gain={gain?.id === w.id ? gain.xp : null}
                finishing={finishing === w.id}
                onToggleSession={() =>
                  setSessionOpen((o) => (o === w.id ? null : w.id))
                }
                onPick={(intensity) => onSession(w, intensity)}
                onFinish={() => setToFinish(w)}
                onOpen={() => openSheet(w)}
                onPercent={(percent) => onPercent(w, percent)}
              />
            )}
          />
        </section>
      )}

      {queued.length > 0 && (
        <section className="mb-9">
          <SectionTitle count={queued.length} className="mb-4 text-[20px]">Para después</SectionTitle>
          {/* A flat queue: each pill already wears its kind's icon and colour,
              and sorting keeps the kinds together without a heading per pill. */}
          <ul className="m-0 grid list-none gap-2 p-0">
            {[...queued]
              .sort((a, b) => WORK_KINDS.indexOf(a.kind) - WORK_KINDS.indexOf(b.kind))
              .map((w) => (
                <QueuedWorkRow
                  key={w.id}
                  work={w}
                  busy={startingId === w.id}
                  onStart={() => onStart(w)}
                  onOpen={() => openSheet(w)}
                />
              ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <SectionTitle count={done.length} className="mb-4 text-[20px]">Terminados</SectionTitle>
          {/* One wall, newest first: every tile already says its kind by
              colour and icon. */}
          <ul className="tile-wall">
            {done.map((w) => (
              <TrophyTile key={w.id} work={w} onOpen={() => openSheet(w)} />
            ))}
          </ul>
        </section>
      )}

      {editing !== undefined && !toDelete && (
        <WorkSheet
          work={editing}
          initialKind={filter ?? undefined}
          busy={saving}
          error={saveError}
          onSave={onSave}
          onDelete={
            editing
              ? () => {
                  setDeleteError(null);
                  setToDelete(editing);
                }
              : undefined
          }
          onCancel={() => setEditing(undefined)}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          bandTitle="¿Quitar del refugio?"
          titleId="delete-work-title"
          busy={deleting}
          error={deleteError}
          confirmLabel="Borrar"
          busyLabel="Borrando…"
          onConfirm={onConfirmDelete}
          onCancel={() => setToDelete(null)}
        >
          <p className="m-0 text-[17px] font-semibold">{toDelete.title}</p>
          <p className="mt-3 mb-0 text-[15px] leading-relaxed text-ink-soft">
            Las sesiones que registraste se quedan en Mente: eso ya pasó.
          </p>
        </ConfirmDialog>
      )}

      {toFinish && (
        <FinishDialog
          work={toFinish}
          onConfirm={(rating) => onFinish(toFinish, rating)}
          onCancel={() => setToFinish(null)}
        />
      )}

      {result && (
        <ResultModal
          result={result}
          category={mente ?? undefined}
          onClose={() => setResult(null)}
          onUndo={async () => {
            await deleteActivity(result.activity.id);
          }}
        />
      )}
    </div>
  );
}
