import { useCallback, useEffect, useRef, useState } from "react";
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
import { playSound } from "../lib/sound";
import { MissionRow } from "../components/MissionRow";
import { MissionSheet } from "../components/MissionSheet";
import { CategoryOptions, WhenPicker } from "../components/MissionOptions";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ResultModal } from "../components/ResultModal";
import { SkeletonCards } from "../components/SkeletonCards";
import { ErrorPanel } from "../components/ErrorPanel";
import { SectionTitle } from "../components/Layout";

/** How long the tick and the fade take before the row moves to "done". */
const COMPLETE_MS = 800;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The open sections, in order of urgency. Late ones say so in terracotta. */
const SECTIONS: {
  group: Exclude<MissionGroup, "done">;
  label: string;
  warn?: boolean;
}[] = [
  { group: "overdue", label: "Vencidas", warn: true },
  { group: "today", label: "Hoy" },
  { group: "upcoming", label: "Próximas" },
  { group: "someday", label: "Sin fecha" },
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
 * with a tap. Apart from the activities — which are logged after the fact —
 * but connected to them: give one a category and completing it lands a Chispa
 * there (docs/DESIGN.md).
 */
export function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Ticking off. The tick starts on the tap, not on the response: the
  // gesture should feel like it landed, and the request runs underneath it.
  const [completing, setCompleting] = useState<Map<number, number | null>>(
    new Map(),
  );
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    res: RegisterActivityResult;
    missionId: number;
  } | null>(null);

  const markCompleting = (id: number, xp: number | null | undefined) =>
    setCompleting((prev) => {
      const next = new Map(prev);
      if (xp === undefined) next.delete(id);
      else next.set(id, xp);
      return next;
    });

  async function onToggle(m: Mission) {
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

    markCompleting(m.id, null);
    // One soft note on the tap, XP or not: the tick is the moment.
    playSound("done");
    const settled = new Promise((r) =>
      window.setTimeout(r, reducedMotion() ? 0 : COMPLETE_MS),
    );

    try {
      const res = await completeMission(m.id);
      if (res.activity) markCompleting(m.id, res.activity.xpGained);
      await settled;
      replace(res.mission);
      // The celebration only where it is earned, as with any quick log.
      if (res.activity?.category.leveledUp) {
        setResult({ res: res.activity, missionId: m.id });
      }
    } catch (err) {
      setRowError((err as Error).message);
    } finally {
      markCompleting(m.id, undefined);
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
      <div className="px-5 pt-16 pb-32">
        <SkeletonCards n={4} height="72px" />
      </div>
    );
  if (error)
    return (
      <div className="px-5 pt-16 pb-32">
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
      completing={completing.has(m.id)}
      gain={completing.get(m.id) ?? null}
      busy={busyId === m.id}
      highlighted={newId === m.id}
      onToggle={() => onToggle(m)}
      onOpen={() => {
        setSaveError(null);
        setEditing(m);
      }}
    />
  );

  return (
    <div className="px-5 pt-10 pb-32">
      <header className="settle mb-7">
        <h1 className="display m-0 text-[34px] leading-tight">Misiones</h1>
        <p className="mt-1 mb-0 text-[14px] text-ink-soft">
          {pending.length === 0
            ? "Nada pendiente"
            : pending.length === 1
              ? "1 pendiente"
              : `${pending.length} pendientes`}
          {atStake > 0 && ` · +${atStake} XP si las cumples`}
        </p>
      </header>

      <form onSubmit={onCreate} className="card settle mb-9 grid gap-4 p-4">
        <div className="flex items-center gap-2.5">
          <input
            ref={inputRef}
            className="field min-w-0 flex-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="¿Qué tienes pendiente?"
            aria-label="Nueva misión"
            maxLength={200}
            enterKeyHint="done"
          />
          <button
            type="submit"
            disabled={creating || title.trim() === ""}
            aria-label="Apuntar misión"
            className="btn w-12 shrink-0 px-0"
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
        </div>

        {/* The options unfold once there is something to attach them to: the
            empty state is a single line asking one question. */}
        {title.trim() !== "" && (
          <div className="settle grid gap-4">
            <WhenPicker value={due} onChange={setDue} />
            <CategoryOptions
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>
        )}

        {formError && <p className="m-0 text-[14px] text-warn">{formError}</p>}
      </form>

      {rowError && <p className="mt-0 mb-6 text-[14px] text-warn">{rowError}</p>}

      {pending.length === 0 ? (
        <div className="settle mb-10 py-6 text-center">
          <p className="m-0 text-[18px] font-semibold">Todo en orden</p>
          <p className="mt-1.5 mb-0 text-[15px] text-ink-soft">
            {done.length > 0
              ? "No te queda nada pendiente."
              : "Apunta arriba la primera llamada o gestión."}
          </p>
        </div>
      ) : (
        SECTIONS.map(({ group, label, warn }) => {
          const list = pending
            .filter((m) => missionGroup(m) === group)
            .sort(byDueThenCreated);
          if (list.length === 0) return null;

          return (
            <section key={group} className="mb-7">
              <SectionTitle count={list.length} className={warn ? "text-warn" : ""}>
                {label}
              </SectionTitle>
              <ul className="m-0 grid list-none gap-2.5 p-0">{list.map(row)}</ul>
            </section>
          );
        })
      )}

      {done.length > 0 && (
        <section className="mt-2">
          <button
            type="button"
            onClick={() => setDoneOpen((o) => !o)}
            aria-expanded={doneOpen}
            className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink-soft"
          >
            Hechas <span className="font-normal text-ink-faint">{done.length}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 transition-transform duration-200 ${doneOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {doneOpen && (
            <ul className="m-0 grid list-none gap-2.5 p-0">{done.map(row)}</ul>
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
          bandTitle="¿Borrar esta misión?"
          titleId="delete-mission-title"
          busy={deleting}
          error={deleteError}
          confirmLabel="Borrar"
          busyLabel="Borrando…"
          onConfirm={onConfirmDelete}
          onCancel={() => setToDelete(null)}
        >
          <p className="m-0 text-[17px] font-semibold">{toDelete.title}</p>
          {toDelete.activityId !== null && (
            <p className="mt-3 mb-0 text-[15px] leading-relaxed text-ink-soft">
              La XP que te dio al cumplirla se queda: eso ya pasó.
            </p>
          )}
        </ConfirmDialog>
      )}

      {result && (
        <ResultModal
          result={result.res}
          category={categoryById.get(result.res.category.id)}
          onClose={() => setResult(null)}
          onUndo={async () => {
            replace((await reopenMission(result.missionId)).mission);
          }}
        />
      )}
    </div>
  );
}
