import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useScreenReady } from "../lib/screenReady";
import {
  completeMission,
  createMission,
  deleteMission,
  getCategories,
  getMissions,
  reopenMission,
  updateMission,
  type Category,
  type Mission,
  type MissionFields,
  type RegisterActivityResult,
} from "../api/client";
import {
  missionGroup,
  MISSION_XP,
  type MissionGroup,
} from "../lib/missions";
import { impactAt, impactOrigin } from "../lib/impact";
import { MissionRow } from "../components/MissionRow";
import { MissionSheet } from "../components/MissionSheet";
import { CategoryOptions, WhenPicker } from "../components/MissionOptions";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ResultModal } from "../components/ResultModal";
import { SkeletonCards } from "../components/SkeletonCards";
import { ErrorPanel } from "../components/ErrorPanel";

/** How long the slash, the stamp and the fling take before the row moves. */
const STAMP_MS = 800;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The open sections, in order of urgency, with each one's tape: late in red,
 * today in the system yellow, the rest in bone.
 */
const SECTIONS: {
  group: Exclude<MissionGroup, "done">;
  label: string;
  tape: string;
  ink: string;
}[] = [
  { group: "overdue", label: "Vencidas", tape: "var(--color-cuerpo)", ink: "var(--color-bone)" },
  { group: "today", label: "Hoy", tape: "var(--color-yellow)", ink: "var(--color-black)" },
  { group: "upcoming", label: "Próximas", tape: "var(--color-bone)", ink: "var(--color-black)" },
  { group: "someday", label: "Sin fecha", tape: "var(--color-bone)", ink: "var(--color-black)" },
];

/** Within a section: dated ones by date, the rest in the order they came. */
function byDueThenCreated(a: Mission, b: Mission): number {
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id - b.id;
}

/**
 * The missions: calls and errands, jotted down in two seconds and ticked off
 * with a slash. Apart from the activities — which are logged after the fact —
 * but connected to them: give one a category and completing it lands a Chispa
 * there (docs/DESIGN.md).
 */
export function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  // The screen wipe holds until this screen has its data.
  useScreenReady(!loading);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([getMissions(), getCategories()])
      .then(([ms, cats]) => {
        setMissions(ms);
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

  const replace = (m: Mission) =>
    setMissions((prev) => prev.map((x) => (x.id === m.id ? m : x)));

  // Jotting one down. The options only unfold once there is something to
  // attach them to: the empty state is a single line asking one question.
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newId, setNewId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim() === "" || creating) return;
    setFormError(null);
    setCreating(true);

    try {
      const m = await createMission({ title, dueDate: due, categoryId });
      setMissions((prev) => [...prev, m]);
      setNewId(m.id);
      setTitle("");
      setDue(null);
      setCategoryId(null);
      // The cursor stays put: errands come in batches.
      inputRef.current?.focus();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  // Ticking off. The stamp starts on the tap, not on the response: the
  // gesture should feel like it landed, and the request runs underneath it.
  const [stamping, setStamping] = useState<Map<number, number | null>>(
    new Map(),
  );
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    res: RegisterActivityResult;
    missionId: number;
  } | null>(null);

  const setStamp = (id: number, xp: number | null | undefined) =>
    setStamping((prev) => {
      const next = new Map(prev);
      if (xp === undefined) next.delete(id);
      else next.set(id, xp);
      return next;
    });

  async function onToggle(m: Mission, el: HTMLElement) {
    setRowError(null);

    if (m.completedAt !== null) {
      setBusyId(m.id);
      try {
        replace((await reopenMission(m.id)).mission);
      } catch (err) {
        setRowError((err as Error).message);
      } finally {
        setBusyId(null);
      }
      return;
    }

    const origin = impactOrigin(el);
    setStamp(m.id, null);
    const stamped = new Promise((r) =>
      window.setTimeout(r, reducedMotion() ? 0 : STAMP_MS),
    );

    try {
      const res = await completeMission(m.id);
      if (res.activity) {
        impactAt(origin);
        setStamp(m.id, res.activity.xpGained);
      }
      await stamped;
      replace(res.mission);
      // The celebration only where it is earned, as with any quick log.
      if (res.activity?.category.leveledUp) {
        setResult({ res: res.activity, missionId: m.id });
      }
    } catch (err) {
      setRowError((err as Error).message);
    } finally {
      setStamp(m.id, undefined);
    }
  }

  // Editing and deleting.
  const [editing, setEditing] = useState<Mission | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Mission | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function onSave(changes: MissionFields) {
    if (!editing) return;
    setSaveError(null);
    setSaving(true);
    try {
      replace(await updateMission(editing.id, changes));
      setEditing(null);
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
      await deleteMission(toDelete.id);
      setMissions((prev) => prev.filter((x) => x.id !== toDelete.id));
      setToDelete(null);
      setEditing(null);
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  const [doneOpen, setDoneOpen] = useState(false);

  if (loading)
    return (
      <div className="px-4 pt-6 pb-32">
        <SkeletonCards n={4} />
      </div>
    );
  if (error)
    return (
      <div className="px-4 pt-6 pb-32">
        <ErrorPanel message={error} onRetry={onRetry} />
      </div>
    );

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const pending = missions.filter((m) => m.completedAt === null);
  const done = missions
    .filter((m) => m.completedAt !== null)
    .sort((a, b) => (a.completedAt! < b.completedAt! ? 1 : -1));
  const atStake = pending.filter((m) => m.categoryId !== null).length * MISSION_XP;
  let rowIndex = 0;

  const row = (m: Mission) => (
    <MissionRow
      key={m.id}
      mission={m}
      category={m.categoryId !== null ? categoryById.get(m.categoryId) : undefined}
      index={rowIndex++}
      stamping={stamping.has(m.id)}
      gain={stamping.get(m.id) ?? null}
      busy={busyId === m.id}
      highlighted={newId === m.id}
      onToggle={(el) => onToggle(m, el)}
      onOpen={() => {
        setSaveError(null);
        setEditing(m);
      }}
    />
  );

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

      <header className="relative mt-7 mb-8">
        <div
          className="bleed-band anim-logo top-[-18px] z-0 h-[96px]"
          style={
            {
              "--band-bg": "var(--color-yellow)",
              "--band-edge": "var(--color-black)",
              "--band-tilt": "-3deg",
            } as React.CSSProperties
          }
        />
        <h1 className="text-sign relative z-10 m-0 font-display text-[34px] leading-[0.92] text-bone uppercase">
          Misiones
        </h1>
        <p className="anim-ribbon relative z-10 mt-5 mb-0 flex flex-wrap items-center gap-2.5">
          <span className="on-scene text-[10px] font-bold tracking-[0.2em] text-bone">
            {pending.length === 1 ? "1 PENDIENTE" : `${pending.length} PENDIENTES`}
          </span>
          {atStake > 0 && (
            <span
              className="bg-yellow px-2 py-0.5 font-display text-[11px] text-black"
              style={{
                transform: "skewX(-10deg)",
                boxShadow: "3px 3px 0 var(--color-black)",
              }}
            >
              <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
                +{atStake} XP EN JUEGO
              </span>
            </span>
          )}
        </p>
      </header>

      <form
        onSubmit={onCreate}
        className="anim-row mb-9 grid gap-3.5"
        style={{ "--delay": "0.08s" } as React.CSSProperties}
      >
        <div className="flex items-stretch gap-3">
          <div className="field-frame min-w-0 flex-1">
            <input
              ref={inputRef}
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué tienes pendiente?"
              aria-label="Nueva misión"
              maxLength={200}
              enterKeyHint="done"
            />
          </div>
          <button
            type="submit"
            disabled={creating || title.trim() === ""}
            aria-label="Apuntar misión"
            className="slam-button"
            style={{ padding: "0 18px", fontSize: 24 }}
          >
            <span>+</span>
          </button>
        </div>

        {title.trim() !== "" && (
          <div className="anim-row grid gap-3">
            <WhenPicker value={due} onChange={setDue} />
            <CategoryOptions
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>
        )}

        {formError && (
          <p className="anim-slam m-0 bg-cuerpo px-3 py-2 text-[11px] font-bold text-bone">
            {formError}
          </p>
        )}
      </form>

      {rowError && (
        <p className="anim-slam mb-6 bg-cuerpo px-3 py-2 text-[11px] font-bold text-bone">
          {rowError}
        </p>
      )}

      {pending.length === 0 ? (
        <div className="anim-row mb-10">
          <p className="text-sign m-0 font-display text-[26px] leading-none text-bone uppercase">
            ¡Vía libre!
          </p>
          <p className="on-scene mt-3 w-fit text-[11.5px] text-bone/80">
            {done.length > 0
              ? "No te queda nada pendiente."
              : "Apunta arriba la primera llamada o gestión."}
          </p>
        </div>
      ) : (
        SECTIONS.map(({ group, label, tape, ink }) => {
          const list = pending
            .filter((m) => missionGroup(m) === group)
            .sort(byDueThenCreated);
          if (list.length === 0) return null;

          return (
            <section key={group} className="mb-8">
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
                  {label} · {list.length}
                </span>
              </h2>
              <ul className="m-0 grid list-none gap-4 p-0">{list.map(row)}</ul>
            </section>
          );
        })
      )}

      {done.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setDoneOpen((o) => !o)}
            aria-expanded={doneOpen}
            className="on-scene mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-bone/80"
          >
            HECHAS · {done.length}
            <span
              className="inline-block transition-transform"
              style={{ transform: doneOpen ? "rotate(180deg)" : "none" }}
            >
              ▾
            </span>
          </button>
          {doneOpen && (
            <ul className="m-0 grid list-none gap-4 p-0">{done.map(row)}</ul>
          )}
        </section>
      )}

      {editing && !toDelete && (
        <MissionSheet
          mission={editing}
          categories={categories}
          busy={saving}
          error={saveError}
          onSave={onSave}
          onDelete={() => {
            setDeleteError(null);
            setToDelete(editing);
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          bandTitle="¿Borrar misión?"
          titleId="delete-mission-title"
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
          {toDelete.activityId !== null && (
            <p className="mt-4 text-[11.5px] leading-relaxed text-bone/75">
              La XP que te dio al cumplirla se queda: eso ya pasó.
            </p>
          )}
        </ConfirmDialog>
      )}

      {result && (
        <ResultModal
          result={result.res}
          category={categoryById.get(result.res.category.id)}
          backTo={null}
          onClose={() => setResult(null)}
          onUndo={async () => {
            replace((await reopenMission(result.missionId)).mission);
          }}
        />
      )}
    </div>
  );
}
