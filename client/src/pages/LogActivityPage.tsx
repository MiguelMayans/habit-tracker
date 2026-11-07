import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createActivity,
  deleteActivity,
  getCategories,
  getFocusesByCategory,
  updateFocus,
  type Category,
  type Focus,
  type Intensity,
  type RegisterActivityResult,
} from "../api/client";
import { playSound } from "../lib/sound";
import { categoryColorVar } from "../lib/categoryColor";
import { orderByLineage } from "../lib/focusLineage";
import { INTENSITY_LABEL, XP_BY_INTENSITY } from "../lib/intensity";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ResultModal } from "../components/ResultModal";
import { CategoryIcon } from "../components/CategoryIcon";
import { BackLink } from "../components/Layout";

const INTENSITIES: Intensity[] = ["chispa", "impulso", "all_out"];

/**
 * "Now", in the local format datetime-local expects. Logging is always
 * retroactive (docs/DESIGN.md), so being able to pick a future date would make
 * no sense.
 */
function localNow(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

/** The parameter is only accepted when it is an integer: it comes from the URL. */
function intParam(params: URLSearchParams, name: string): string {
  const value = params.get(name);
  return value !== null && /^\d+$/.test(value) ? value : "";
}

/** One category, as a tile with its icon. Picked, it fills with its colour. */
function CategoryPick({
  category: c,
  selected,
  onPick,
}: {
  category: Category;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onPick}
      className={`press flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
        selected ? "border-transparent text-paper" : "border-line bg-paper"
      }`}
      style={
        {
          "--accent": categoryColorVar(c.slug),
          background: selected ? "var(--accent)" : undefined,
        } as React.CSSProperties
      }
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-full ${
          selected ? "bg-paper/20 text-paper" : "icon-disc"
        }`}
      >
        <CategoryIcon slug={c.slug} strokeWidth={1.8} className="h-4 w-4" />
      </span>
      <span className="text-[15px] font-medium">{c.name}</span>
    </button>
  );
}

export function LogActivityPage() {
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [focuses, setFocuses] = useState<Focus[]>([]);

  // Incoming context: arriving from a category or a focus, they come already
  // chosen. Read once, on mount.
  const [categoryId, setCategoryId] = useState(() =>
    intParam(searchParams, "category"),
  );
  const [focusId, setFocusId] = useState(() =>
    intParam(searchParams, "focus"),
  );
  const [originCategory] = useState(() =>
    intParam(searchParams, "category"),
  );
  // Arriving from a focus, the category is already decided: changing it would
  // invalidate the focus. It can be unlocked by hand.
  const [categoryLocked, setCategoryLocked] = useState(
    () => intParam(searchParams, "focus") !== "",
  );
  const [description, setDescription] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("chispa");
  const [date, setDate] = useState("");
  const [editingDate, setEditingDate] = useState(false);

  // Calling the focus done. It lives here and not on the home card: from the
  // card what you do is log, and an action that changes the focus itself
  // should not sit a finger away from the intensities.
  const [closingFocus, setClosingFocus] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterActivityResult | null>(null);

  useEffect(() => {
    getCategories()
      .then((cats) => {
        setCategories(cats);
        // The category can come from the URL: if it does not exist, it is
        // dropped here rather than letting the failure surface on submit.
        setCategoryId((current) =>
          current === "" || cats.some((c) => String(c.id) === current)
            ? current
            : "",
        );
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  // Changing category invalidates the chosen focus and the list: cleared in
  // the event itself, not in an effect.
  function onChangeCategory(value: string) {
    setCategoryId(value);
    setFocusId("");
    setFocuses([]);
  }

  function unlockCategory() {
    setCategoryLocked(false);
    setFocusId("");
  }

  // The focuses depend on the chosen category.
  useEffect(() => {
    if (categoryId === "") return;

    // Discard the response if the category changed in the meantime.
    let cancelled = false;

    getFocusesByCategory(Number(categoryId))
      .then((f) => {
        if (cancelled) return;
        setFocuses(f);
        // Same rule as for the category: a focus from the URL that does not
        // exist or is frozen is dropped before it can be submitted.
        setFocusId((current) =>
          current === "" ||
          f.some((x) => String(x.id) === current && !x.frozen)
            ? current
            : "",
        );
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSending(true);

    try {
      const res = await createActivity({
        categoryId: Number(categoryId),
        focusId: focusId === "" ? undefined : Number(focusId),
        description,
        intensity,
        // With no date, the backend uses the current one.
        date: date === "" ? undefined : new Date(date).toISOString(),
      });

      playSound("earn");
      setResult(res);
      setDescription("");
      setDate("");
      setEditingDate(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  /**
   * The real DELETE. On failure it is left to throw: the modal catches the
   * error and shows it in its own dialog, rather than duplicating that
   * handling here.
   */
  async function onUndo() {
    if (!result) return;

    await deleteActivity(result.activity.id);

    // The reverted XP changed the category's level (and the focus's, if there
    // was one): whatever feeds the selects is reloaded so it does not sit
    // there showing a level that is no longer real.
    const cats = await getCategories();
    setCategories(cats);
    if (result.activity.focusId !== null && categoryId !== "") {
      setFocuses(await getFocusesByCategory(Number(categoryId)));
    }
  }

  async function onConfirmCloseFocus() {
    if (focusId === "") return;
    setCloseError(null);
    setClosing(true);

    try {
      await updateFocus(Number(focusId), { frozen: true });
      setClosingFocus(false);
      // A closed focus takes no activity, so it can no longer be selected: it
      // is released, and the list reloads so it shows as closed.
      setFocusId("");
      setFocuses(await getFocusesByCategory(Number(categoryId)));
    } catch (e) {
      setCloseError((e as Error).message);
    } finally {
      setClosing(false);
    }
  }

  const selected = categories.find((c) => String(c.id) === categoryId);
  const selectedFocus = focuses.find((f) => String(f.id) === focusId);

  return (
    <div className="px-5 pt-6 pb-32">
      <BackLink />

      <h1 className="display settle mt-6 mb-8 text-[34px] leading-tight">
        Registrar
      </h1>

      <form onSubmit={onSubmit} className="grid gap-7">
        <div className="settle">
          <span className="field-label">Categoría</span>
          {categoryLocked && selected ? (
            // Locked because you came from one of its focuses: changing it
            // would orphan that focus. Shown alone, releasable by hand.
            <div className="flex items-center gap-4">
              <div className="flex-1" role="radiogroup" aria-label="Categoría">
                <CategoryPick category={selected} selected onPick={() => {}} />
              </div>
              <button type="button" onClick={unlockCategory} className="link-quiet shrink-0">
                Cambiar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Categoría">
              {categories.map((c) => (
                <CategoryPick
                  key={c.id}
                  category={c}
                  selected={String(c.id) === categoryId}
                  onPick={() => onChangeCategory(String(c.id))}
                />
              ))}
            </div>
          )}
        </div>

        {/* No category yet, no focus section: a disabled control is only a
            promise of something you cannot use. */}
        {categoryId !== "" && (
          <div className="settle">
            <span className="field-label">
              Foco <span className="font-normal text-ink-faint">· opcional</span>
            </span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Foco">
              <button
                type="button"
                role="radio"
                aria-checked={focusId === ""}
                onClick={() => setFocusId("")}
                className="chip"
              >
                Sin foco
              </button>
              {/* Frozen focuses are left out: they take no activity. */}
              {orderByLineage(focuses.filter((f) => !f.frozen)).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={String(f.id) === focusId}
                  onClick={() => setFocusId(String(f.id))}
                  className="chip"
                >
                  {f.name}
                </button>
              ))}
            </div>

            {selectedFocus && !selectedFocus.frozen && (
              <button
                type="button"
                onClick={() => {
                  setCloseError(null);
                  setClosingFocus(true);
                }}
                className="link-quiet mt-3 text-[13px]"
              >
                Dar «{selectedFocus.name}» por terminado
              </button>
            )}
          </div>
        )}

        <label className="settle block">
          <span className="field-label">
            Qué hiciste <span className="font-normal text-ink-faint">· opcional</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Si te apetece contarlo."
            className="field"
          />
        </label>

        <fieldset className="settle m-0 border-0 p-0">
          <legend className="field-label">Intensidad</legend>
          <div className="grid grid-cols-3 gap-2.5">
            {INTENSITIES.map((i) => (
              <button
                key={i}
                type="button"
                aria-pressed={intensity === i}
                onClick={() => setIntensity(i)}
                className={`grid gap-0.5 rounded-2xl border px-2 py-3 transition-colors ${
                  intensity === i
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-paper"
                }`}
              >
                <span className="text-[15px] font-medium">{INTENSITY_LABEL[i]}</span>
                <span className={`text-[12px] ${intensity === i ? "text-paper/70" : "text-ink-soft"}`}>
                  +{XP_BY_INTENSITY[i]} XP
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="settle">
          <span className="field-label">Cuándo</span>
          {date === "" && !editingDate ? (
            // The normal case is logging something you just did, so the
            // default states "now" rather than planting a date picker.
            <button
              type="button"
              onClick={() => setEditingDate(true)}
              className="field flex items-center text-left"
            >
              <span className="flex-1">Ahora</span>
              <span className="text-[14px] text-ink-soft">Otro momento</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="datetime-local"
                value={date}
                max={localNow()}
                autoFocus
                onChange={(e) => setDate(e.target.value)}
                aria-label="Fecha y hora"
                className="field flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  setDate("");
                  setEditingDate(false);
                }}
                className="link-quiet shrink-0"
              >
                Ahora
              </button>
            </div>
          )}
        </div>

        {error && <p className="m-0 text-[14px] text-warn">{error}</p>}

        <button
          type="submit"
          disabled={sending || categoryId === ""}
          className="btn settle w-full"
        >
          {sending ? "Registrando…" : "Registrar"}
        </button>
      </form>

      {closingFocus && selectedFocus && (
        <ConfirmDialog
          bandTitle="¿Darlo por terminado?"
          titleId="close-focus-title"
          busy={closing}
          error={closeError}
          confirmLabel="Darlo por terminado"
          busyLabel="Cerrando…"
          onConfirm={onConfirmCloseFocus}
          onCancel={() => setClosingFocus(false)}
        >
          <p className="m-0 text-[17px] font-semibold">{selectedFocus.name}</p>
          <p className="mt-3 mb-0 text-[15px] leading-relaxed text-ink-soft">
            Deja de aceptar actividad y pasa a poder tener un foco hijo más
            especializado. La XP que ganaste no se toca, y puedes reabrirlo
            desde su categoría.
          </p>
        </ConfirmDialog>
      )}

      {result && (
        <ResultModal
          result={result}
          category={selected}
          backTo={originCategory}
          onClose={() => setResult(null)}
          onUndo={onUndo}
        />
      )}
    </div>
  );
}
