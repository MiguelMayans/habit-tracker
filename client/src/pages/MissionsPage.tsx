import { useCallback, useEffect, useRef, useState } from "react";
import {
  completeMission,
  createMission,
  deleteMission,
  getCategories,
  peek,
  getMissions,
  reopenMission,
  updateMission,
  type Category,
  type Mission,
  type MissionFields,
  type RegisterActivityResult,
} from "../api/client";
import {
  MISSIONS_CHANGED,
  urgentCount,
  missionGroup,
  MISSION_XP,
  type MissionGroup,
} from "../lib/missions";
import { cue } from "../lib/sound";
import { showToast } from "../lib/toast";
import { reducedMotion, withViewTransition } from "../lib/viewTransition";
import { MissionRow } from "../components/MissionRow";
import { DayPulse } from "../components/DayPulse";
import { SectionGlyph } from "../components/MissionIcons";
import { MissionSheet } from "../components/MissionSheet";
import { CategoryOptions, WhenPicker } from "../components/MissionOptions";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ResultModal } from "../components/ResultModal";
import { SkeletonCards } from "../components/SkeletonCards";
import { ErrorPanel } from "../components/ErrorPanel";
import { StaleNotice } from "../components/StaleNotice";
import { useOnReturn } from "../lib/useOnReturn";
import { Collapse } from "../components/Collapse";

/** How long the tick shows before the row travels down to "done". */
const COMPLETE_MS = 650;

/** The open sections, in order of urgency. Late ones say so in terracotta. */
const SECTIONS: {
  group: Exclude<MissionGroup, "done">;
  label: string;
  warn?: boolean;
}[] = [
  { group: "overdue", label: "Vencidas", warn: true },
  { group: "today", label: "Hoy" },
  { group: "upcoming", label: "Próximas" },
  { group: "someday", label: "Algún día" },
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
  // Painted from the last answer when there is one, refreshed underneath.
  const [missions, setMissions] = useState<Mission[]>(() => peek<Mission[]>("/missions") ?? []);
  const [categories, setCategories] = useState<Category[]>(
    () => peek<Category[]>("/categories") ?? [],
  );
  const [loading, setLoading] = useState(
    () => peek("/missions") === undefined || peek("/categories") === undefined,
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([getMissions(), getCategories()])
      .then(([ms, cats]) => {
        setMissions(ms);
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
    if (missions.length === 0) setLoading(true);
    setError(null);
    load();
  }

  // The bar's badge follows what happens here (see BottomNav).
  useEffect(() => {
    if (loading) return;
    window.dispatchEvent(
      new CustomEvent(MISSIONS_CHANGED, { detail: urgentCount(missions) }),
    );
  }, [missions, loading]);

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
      withViewTransition(() => setMissions((prev) => [...prev, m]));
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

  // Set when a tick clears the last of today's: the pulse celebrates once.
  const [justCleared, setJustCleared] = useState(false);

  async function onToggle(m: Mission) {
    setRowError(null);

    if (m.completedAt !== null) {
      setBusyId(m.id);
      try {
        const { mission } = await reopenMission(m.id);
        withViewTransition(() => replace(mission));
      } catch (err) {
        setRowError((err as Error).message);
      } finally {
        setBusyId(null);
      }
      return;
    }

    markCompleting(m.id, null);
    // One soft note on the tap, XP or not: the tick is the moment.
    cue("done");
    const settled = new Promise((r) =>
      window.setTimeout(r, reducedMotion() ? 0 : COMPLETE_MS),
    );

    try {
      const res = await completeMission(m.id);
      if (res.activity) markCompleting(m.id, res.activity.xpGained);
      await settled;
      // The row glides to its place among the done ones (or out, if that
      // section is folded) while the rest close the gap.
      const g = missionGroup(m);
      const lastOfToday =
        (g === "today" || g === "overdue") &&
        missions.filter((x) => {
          const xg = missionGroup(x);
          return x.id !== m.id && (xg === "today" || xg === "overdue");
        }).length === 0;
      if (lastOfToday) setJustCleared(true);
      withViewTransition(() => {
        replace(res.mission);
        markCompleting(m.id, undefined);
      });
      // The celebration only where it is earned, as with any quick log.
      if (res.activity?.category.leveledUp) {
        setResult({ res: res.activity, missionId: m.id });
      } else {
        showToast({
          message: res.activity
            ? `Hecha · +${res.activity.xpGained} XP`
            : "Hecha",
          action: {
            label: "Deshacer",
            run: async () => {
              const { mission } = await reopenMission(m.id);
              setJustCleared(false);
              withViewTransition(() => replace(mission));
            },
          },
        });
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
      withViewTransition(() =>
        setMissions((prev) => prev.filter((x) => x.id !== toDelete.id)),
      );
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
  if (error && missions.length === 0)
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

  const row = (m: Mission) => (
    <MissionRow
      key={m.id}
      mission={m}
      category={m.categoryId !== null ? categoryById.get(m.categoryId) : undefined}
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
      <header className="settle mb-6">
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

      {error && <StaleNotice message={error} onRetry={onRetry} />}

      <DayPulse missions={missions} justCleared={justCleared} />

      {rowError && <p className="mt-0 mb-5 text-[14px] text-warn">{rowError}</p>}

      <form onSubmit={onCreate} className="settle mb-8">
        <div className="composer">
          <input
            ref={inputRef}
            className="display min-w-0 flex-1 bg-transparent py-2 text-[18px] placeholder:text-ink-faint placeholder:italic focus:outline-none"
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
            className="btn h-10 min-h-0 w-10 shrink-0 px-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {/* The options unfold once there is something to attach them to:
            the empty state is a single line asking one question. */}
        <Collapse open={title.trim() !== ""}>
          <div className="grid gap-3.5 px-2 pt-4">
            <WhenPicker value={due} onChange={setDue} />
            <CategoryOptions
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>
        </Collapse>

        {formError && <p className="m-0 mt-2 text-[14px] text-warn">{formError}</p>}
      </form>

      {pending.length === 0 ? (
        <div className="settle py-10 text-center">
          <p className="display m-0 text-[26px]">Todo hecho.</p>
          <p className="mt-1.5 mb-0 text-[15px] text-ink-soft">
            {done.length > 0
              ? "No te queda nada pendiente. Disfruta el hueco."
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
            <section key={group} className="mb-8">
              <h2
                className={`display m-0 flex items-center gap-2.5 text-[22px] ${warn ? "text-warn" : ""}`}
              >
                <SectionGlyph
                  group={group}
                  className={`h-5 w-5 ${warn ? "" : "text-ink-soft"}`}
                />
                {label}
                <span className="font-sans text-[13px] font-normal text-ink-faint">
                  {list.length}
                </span>
              </h2>
              <ul className="m-0 list-none p-0">{list.map(row)}</ul>
            </section>
          );
        })
      )}

      {done.length > 0 && (
        <section>
          <h2 className="m-0">
            <button
              type="button"
              onClick={() => withViewTransition(() => setDoneOpen((o) => !o))}
              aria-expanded={doneOpen}
              className="display flex items-baseline gap-2 text-[22px] text-ink-soft"
            >
              Hechas
              <span className="font-sans text-[13px] font-normal text-ink-faint">
                {done.length}
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-4 w-4 self-center transition-transform duration-200 ${doneOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </h2>
          {doneOpen && <ul className="m-0 list-none p-0">{done.map(row)}</ul>}
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
