import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useScreenReady } from "../lib/screenReady";
import {
  createWork,
  deleteActivity,
  deleteWork,
  getCategories,
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
import { impactAt, impactOrigin } from "../lib/impact";
import { playSound } from "../lib/sound";
import { useLight } from "../lib/useLight";
import { KIND_LABEL, WORK_KINDS } from "../lib/works";
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

/** How long the stamp and the fling take before the card moves to the case. */
const FINISH_MS = 800;
const MENTE = "var(--color-mente)";

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Newest first; null (never) last. */
const desc = (a: string | null, b: string | null) =>
  a === b ? 0 : a === null ? 1 : b === null ? -1 : a < b ? 1 : -1;

/** A section's tape, in the same idiom as the missions. */
function SectionTape({
  label,
  count,
  tape,
  ink,
}: {
  label: string;
  count: number;
  tape: string;
  ink: string;
}) {
  return (
    <h2
      className="anim-row m-0 mb-4 inline-block px-2.5 py-0.5 font-display text-[12px] uppercase"
      style={{
        background: tape,
        color: ink,
        transform: "skewX(-10deg)",
        boxShadow: "3px 3px 0 var(--color-black)",
      }}
    >
      <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
        {label} · {count}
      </span>
    </h2>
  );
}

/**
 * A section's works, grouped by kind — books with books, games with games —
 * in the filter chips' order, each group under a small label. With a filter
 * on there is only one kind, and the labels would only repeat it.
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
  /** `index` runs across the whole section, for the collage's tilts. */
  render: (work: Work, index: number) => ReactNode;
}) {
  if (!grouped) {
    return <ul className={listClassName}>{works.map(render)}</ul>;
  }

  let index = 0;
  return (
    <div className="grid gap-9">
      {WORK_KINDS.map((kind) => {
        const items = works.filter((w) => w.kind === kind);
        if (items.length === 0) return null;
        return (
          <div key={kind}>
            {/* A heading with weight, not a caption: it is what sorts the
                screen. The icon on a bone tag, the word in the display face
                with the signs' outline, and the count in the figures'. */}
            <h3 className="anim-row m-0 mb-4 flex items-center gap-3">
              <span
                className="grid h-9 w-10 shrink-0 place-items-center bg-bone text-black"
                style={{
                  transform: "skewX(-10deg)",
                  boxShadow: "4px 4px 0 var(--color-black)",
                }}
              >
                <WorkKindIcon
                  kind={kind}
                  className="h-[22px] w-[22px]"
                />
              </span>
              <span className="text-sign font-display text-[26px] leading-none text-bone uppercase">
                {KIND_LABEL[kind].many}
              </span>
              <b className="text-sign font-figure text-[22px] leading-none text-yellow">
                {items.length}
              </b>
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
 * the ones waiting their turn, and a trophy case of the finished. Its sessions
 * are Mente's XP — conscious leisure (docs/DESIGN.md) — so the sky here is
 * Mente's purple.
 */
export function LairPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  // The screen wipe holds until this screen has its data.
  useScreenReady(!loading);
  const [error, setError] = useState<string | null>(null);

  useLight(MENTE);

  const load = useCallback(() => {
    Promise.all([getWorks(), getCategories()])
      .then(([ws, cats]) => {
        setWorks(ws);
        setCategories(cats);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function onRetry() {
    setLoading(true);
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

  async function onSession(w: Work, intensity: Intensity, chip: HTMLElement) {
    setRowError(null);
    setSessionBusy(true);
    const origin = impactOrigin(chip);
    try {
      const res = await logWorkSession(w.id, intensity);
      impactAt(origin);
      replace(res.work);
      setSessionOpen(null);
      setGain({ id: w.id, xp: res.activity.xpGained });
      if (res.activity.category.leveledUp) setResult(res.activity);
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
    playSound("stamp");
    const stamped = new Promise((r) =>
      window.setTimeout(r, reducedMotion() ? 0 : FINISH_MS),
    );
    try {
      const updated = await updateWork(w.id, { status: "done", rating });
      await stamped;
      replace(updated);
    } catch (err) {
      setRowError((err as Error).message);
    } finally {
      setFinishing(null);
    }
  }

  const [startingId, setStartingId] = useState<number | null>(null);

  async function onStart(w: Work) {
    setRowError(null);
    setStartingId(w.id);
    try {
      replace(await updateWork(w.id, { status: "active" }));
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
        replace(await updateWork(editing.id, fields));
      } else {
        const w = await createWork(fields);
        setWorks((prev) => [...prev, w]);
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
      setWorks((prev) => prev.filter((x) => x.id !== toDelete.id));
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
      <div className="px-4 pt-6 pb-32">
        <SkeletonCards n={3} />
      </div>
    );
  if (error)
    return (
      <div className="px-4 pt-6 pb-32">
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
    <div className="px-4 pt-6 pb-32">
      <Link
        to="/"
        className="anim-row inline-block bg-bone px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-black"
        style={{ transform: "skewX(-10deg)" }}
      >
        <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
          ← CATEGORÍAS
        </span>
      </Link>

      <header className="relative mt-7 mb-7">
        <div
          className="bleed-band anim-logo top-[-18px] z-0 h-[96px]"
          style={
            {
              "--band-bg": MENTE,
              "--band-edge": "var(--color-black)",
              "--band-tilt": "3deg",
            } as React.CSSProperties
          }
        />
        <h1 className="text-sign relative z-10 m-0 font-display text-[34px] leading-[0.92] text-bone uppercase">
          Guarida
        </h1>
        <p className="anim-ribbon relative z-10 mt-5 mb-0 flex flex-wrap items-center gap-2.5">
          <span className="on-scene text-[10px] font-bold tracking-[0.2em] text-bone">
            {works.filter((w) => w.status === "active").length} EN CURSO
          </span>
          <span className="on-scene text-[10px] font-bold tracking-[0.14em] text-bone/75">
            CADA SESIÓN SUMA EN{" "}
            <b style={{ color: MENTE }}>MENTE</b>
          </span>
        </p>
      </header>

      {/* Filtering by kind only once there is more than one to tell apart:
          with a single kind, a row of chips would filter nothing. */}
      {kindsInUse.size > 1 && (
        <div
          className="anim-row mb-6 flex flex-wrap gap-2.5"
          style={{ "--delay": "0.06s" } as React.CSSProperties}
        >
          <button
            type="button"
            className="option-chip"
            aria-pressed={filter === null}
            onClick={() => setFilter(null)}
          >
            <span>Todo</span>
          </button>
          {WORK_KINDS.filter((k) => kindsInUse.has(k)).map((k) => (
            <button
              key={k}
              type="button"
              className="option-chip"
              aria-pressed={filter === k}
              onClick={() => setFilter(filter === k ? null : k)}
            >
              <span>
                <span className="inline-flex items-center gap-1.5">
                  <WorkKindIcon kind={k} className="h-3.5 w-3.5" />
                  {KIND_LABEL[k].many}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => openSheet(null)}
        className="slam-button anim-row mb-9 w-full"
        style={
          {
            "--delay": "0.1s",
            background: "var(--color-bone)",
          } as React.CSSProperties
        }
      >
        <span>+ Añadir a la guarida</span>
      </button>

      {rowError && (
        <p className="anim-slam mb-6 bg-cuerpo px-3 py-2 text-[11px] font-bold text-bone">
          {rowError}
        </p>
      )}

      {works.length === 0 && (
        <div className="anim-row mb-10">
          <p className="text-sign m-0 font-display text-[26px] leading-none text-bone uppercase">
            La guarida está vacía
          </p>
          <p className="on-scene mt-3 w-fit text-[11.5px] text-bone/80">
            Añade lo que estés jugando, leyendo o viendo.
          </p>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-10">
          <SectionTape
            label="En curso"
            count={active.length}
            tape={MENTE}
            ink="var(--color-bone)"
          />
          <KindGroups
            works={active}
            grouped={filter === null}
            listClassName="m-0 grid list-none gap-6 p-0"
            render={(w, i) => (
              <ActiveWorkCard
                key={w.id}
                work={w}
                menteId={mente?.id ?? null}
                index={i}
                open={sessionOpen === w.id}
                busy={sessionBusy}
                gain={gain?.id === w.id ? gain.xp : null}
                finishing={finishing === w.id}
                onToggleSession={() =>
                  setSessionOpen((o) => (o === w.id ? null : w.id))
                }
                onPick={(intensity, chip) => onSession(w, intensity, chip)}
                onFinish={() => setToFinish(w)}
                onOpen={() => openSheet(w)}
              />
            )}
          />
        </section>
      )}

      {queued.length > 0 && (
        <section className="mb-10">
          <SectionTape
            label="En la recámara"
            count={queued.length}
            tape="var(--color-bone)"
            ink="var(--color-black)"
          />
          <KindGroups
            works={queued}
            grouped={filter === null}
            listClassName="m-0 grid list-none gap-3.5 p-0"
            render={(w, i) => (
              <QueuedWorkRow
                key={w.id}
                work={w}
                index={i}
                busy={startingId === w.id}
                onStart={() => onStart(w)}
                onOpen={() => openSheet(w)}
              />
            )}
          />
        </section>
      )}

      {done.length > 0 && (
        <section>
          <SectionTape
            label="Vitrina"
            count={done.length}
            tape="var(--color-yellow)"
            ink="var(--color-black)"
          />
          {/* The case stays one grid, newest first: grouped, each kind
              with a single trophy left half a row empty, and every tile
              already says its kind. */}
          <KindGroups
            works={done}
            grouped={false}
            listClassName="m-0 grid list-none grid-cols-2 gap-4 p-0"
            render={(w, i) => (
              <TrophyTile key={w.id} work={w} index={i} onOpen={() => openSheet(w)} />
            )}
          />
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
          bandTitle="¿Sacar de la guarida?"
          titleId="delete-work-title"
          busy={deleting}
          error={deleteError}
          confirmLabel="Borrar"
          busyLabel="Borrando…"
          onConfirm={onConfirmDelete}
          onCancel={() => setToDelete(null)}
        >
          <p className="m-0 font-display text-[18px] leading-tight text-bone uppercase">
            {toDelete.title}
          </p>
          <p className="mt-4 text-[11.5px] leading-relaxed text-bone/75">
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
          backTo={null}
          onClose={() => setResult(null)}
          onUndo={async () => {
            await deleteActivity(result.activity.id);
          }}
        />
      )}
    </div>
  );
}
