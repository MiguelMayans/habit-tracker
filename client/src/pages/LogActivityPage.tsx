import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import { categoryColorVar } from "../lib/categoryColor";
import { categoryWordmark } from "../lib/categoryWordmark";
import { orderByLineage } from "../lib/focusLineage";
import { useLight } from "../lib/useLight";
import { INTENSITY_LABEL, XP_BY_INTENSITY } from "../lib/intensity";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ResultModal } from "../components/ResultModal";

const INTENSITIES: { value: Intensity; tilt: string }[] = [
  { value: "chispa", tilt: "-1.4deg" },
  { value: "impulso", tilt: "0.9deg" },
  { value: "all_out", tilt: "-1deg" },
];

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

/**
 * One category, as a tile with its drawn wordmark. Picked, it lights up in
 * its colour, the way the category's own screen does.
 */
function CategoryPick({
  category: c,
  selected,
  onPick,
  className = "",
}: {
  category: Category;
  selected: boolean;
  onPick: () => void;
  className?: string;
}) {
  const wordmark = categoryWordmark(c.slug);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${c.name}, nivel ${c.level}`}
      onClick={onPick}
      className={`category-pick ${className}`}
      data-selected={selected}
      style={
        { "--accent": categoryColorVar(c.slug) } as React.CSSProperties
      }
    >
      {wordmark ? (
        <img
          src={wordmark.src}
          alt=""
          width={wordmark.width}
          height={wordmark.height}
          className="category-pick-mark"
        />
      ) : (
        <span className="text-sign-fine font-display text-[17px] text-bone uppercase">
          {c.name}
        </span>
      )}
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
  const accent = selected
    ? categoryColorVar(selected.slug)
    : "var(--color-yellow)";

  // Choosing a category paints the rays in its colour. While none is chosen
  // they keep the home's red: they do not pre-empt a decision you have not
  // made.
  useLight(selected ? categoryColorVar(selected.slug) : null);

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

      {/* The band takes the chosen category's colour: the header responds to
          what you are filling in. */}
      <header className="relative mt-7 mb-9">
        <div
          className="bleed-band anim-logo top-[-18px] z-0 h-[96px]"
          style={
            {
              "--band-bg": accent,
              "--band-edge": "var(--color-black)",
              "--band-tilt": "3deg",
              transition: "background-color .12s steps(2)",
            } as React.CSSProperties
          }
        />
        <h1 className="text-sign relative z-10 m-0 font-display text-[34px] leading-[0.92] text-bone uppercase">
          Registrar
        </h1>
      </header>

      <form onSubmit={onSubmit} className="grid gap-6">
        {/* Category and focus are picked by tapping, not from native
            selects: a system dropdown is the one piece of the screen the app
            cannot style, and it looked like it. The categories are the same
            drawn wordmarks as on the home, and the focuses the same tabs as
            the home card's disclosure — so this screen speaks the home's
            language instead of a form's. */}
        <div
          className="anim-row grid gap-2.5"
          style={{ "--delay": "0.06s" } as React.CSSProperties}
        >
          <span className="field-label justify-self-start">
            <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
              CATEGORÍA
            </span>
          </span>
          {categoryLocked && selected ? (
            // Locked because you came from one of its focuses: changing it
            // would orphan that focus. Shown alone, releasable by hand.
            <div className="flex items-center gap-4">
              <CategoryPick
                category={selected}
                selected
                onPick={() => {}}
                className="flex-1"
              />
              <button
                type="button"
                onClick={unlockCategory}
                className="shrink-0 text-[9.5px] font-bold tracking-[0.16em] text-yellow underline"
              >
                CAMBIAR
              </button>
            </div>
          ) : (
            <div
              className="grid grid-cols-2 gap-x-3 gap-y-3.5"
              role="radiogroup"
              aria-label="Categoría"
            >
              {categories.map((c, i) => (
                <CategoryPick
                  key={c.id}
                  category={c}
                  selected={String(c.id) === categoryId}
                  onPick={() => onChangeCategory(String(c.id))}
                  // An odd one out takes the whole last row, centred, rather
                  // than leaving a hole beside it.
                  className={
                    i === categories.length - 1 && categories.length % 2 === 1
                      ? "col-span-2 w-1/2 justify-self-center"
                      : ""
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* No category yet, no focus section: a disabled control is only a
            promise of something you cannot use. */}
        {categoryId !== "" && (
          <div
            className="anim-row grid gap-2.5"
            style={{ "--delay": "0.04s" } as React.CSSProperties}
          >
            <span className="field-label justify-self-start">
              <span
                className="inline-block"
                style={{ transform: "skewX(10deg)" }}
              >
                FOCO · OPCIONAL
              </span>
            </span>
            <div
              className="flex flex-wrap gap-x-2.5 gap-y-3"
              role="radiogroup"
              aria-label="Foco"
              style={{ "--accent": accent } as React.CSSProperties}
            >
              <button
                type="button"
                role="radio"
                aria-checked={focusId === ""}
                onClick={() => setFocusId("")}
                className="focus-tab"
                data-open={focusId === ""}
              >
                <span className="text-[10px] font-bold tracking-[0.16em]">
                  SIN FOCO
                </span>
              </button>
              {/* Frozen focuses are left out: they take no activity. */}
              {orderByLineage(focuses.filter((f) => !f.frozen)).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={String(f.id) === focusId}
                  onClick={() => setFocusId(String(f.id))}
                  className="focus-tab"
                  data-open={String(f.id) === focusId}
                >
                  <span>
                    <b className="font-display text-[12px] leading-none font-normal uppercase">
                      {f.name}
                    </b>
                    <span className="text-[9px] font-bold tracking-[0.12em] opacity-75">
                      NV {f.level}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Outside the <label> on purpose: a button inside a label also
            fires the control the label points at. */}
        {selectedFocus && !selectedFocus.frozen && (
          <button
            type="button"
            onClick={() => {
              setCloseError(null);
              setClosingFocus(true);
            }}
            className="anim-row -mt-3 justify-self-start bg-black px-1.5 py-0.5 text-[9px] font-bold tracking-[0.16em] text-bone/70 underline"
            style={{ "--delay": "0.14s" } as React.CSSProperties}
          >
            DAR "{selectedFocus.name.toUpperCase()}" POR TERMINADO
          </button>
        )}

        <label
          className="anim-row grid gap-2"
          style={{ "--delay": "0.18s" } as React.CSSProperties}
        >
          <span className="field-label justify-self-start">
            <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
              QUÉ HICISTE · OPCIONAL
            </span>
          </span>
          <div className="field-frame">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Si te apetece contarlo."
              className="field resize-none"
            />
          </div>
        </label>

        {/* Three chips instead of a select: intensity is the weightiest
            decision in this form and deserves to be seen whole. */}
        <fieldset
          className="anim-row m-0 grid gap-2 border-0 p-0"
          style={{ "--delay": "0.24s" } as React.CSSProperties}
        >
          <legend className="field-label mb-2">
            <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
              INTENSIDAD
            </span>
          </legend>
          <div className="grid grid-cols-3 gap-3">
            {INTENSITIES.map((i) => (
              <button
                key={i.value}
                type="button"
                aria-pressed={intensity === i.value}
                onClick={() => setIntensity(i.value)}
                className="intensity-chip"
                style={{ "--rotation": i.tilt } as React.CSSProperties}
              >
                <span className="block">
                  <span className="block text-[13px] leading-tight">
                    {INTENSITY_LABEL[i.value]}
                  </span>
                  <span className="mt-1 block font-display text-[17px] leading-none">
                    {XP_BY_INTENSITY[i.value]}
                    <span className="text-[9px]"> XP</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div
          className="anim-row grid gap-2"
          style={{ "--delay": "0.3s" } as React.CSSProperties}
        >
          <span className="field-label justify-self-start">
            <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
              CUÁNDO
            </span>
          </span>

          {date === "" && !editingDate ? (
            // The normal case is logging something you just did, so the
            // default states "now" rather than planting a date picker that
            // almost never gets touched.
            <button
              type="button"
              onClick={() => setEditingDate(true)}
              className="field-frame flex items-center text-left"
            >
              <span className="field flex-1" style={{ width: "auto" }}>
                Ahora
              </span>
              <span
                className="mr-3 shrink-0 text-[9px] font-bold tracking-[0.16em] text-yellow underline"
                style={{ transform: "skewX(7deg)" }}
              >
                OTRO MOMENTO
              </span>
            </button>
          ) : (
            <div className="field-frame flex items-center">
              <input
                type="datetime-local"
                value={date}
                max={localNow()}
                autoFocus
                onChange={(e) => setDate(e.target.value)}
                className="field flex-1"
                style={{ width: "auto" }}
              />
              <button
                type="button"
                onClick={() => {
                  setDate("");
                  setEditingDate(false);
                }}
                className="mr-3 shrink-0 text-[9px] font-bold tracking-[0.16em] text-yellow underline"
                style={{ transform: "skewX(7deg)" }}
              >
                AHORA
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={sending || categoryId === ""}
          className="slam-button anim-row mt-1 w-full"
          style={{ "--delay": "0.36s" } as React.CSSProperties}
        >
          <span>{sending ? "Registrando…" : "Registrar"}</span>
        </button>
      </form>

      {error && (
        <p className="anim-slam mt-6 bg-cuerpo px-4 py-3 text-[12px] font-bold text-bone">
          {error}
        </p>
      )}

      {closingFocus && selectedFocus && (
        <ConfirmDialog
          bandTitle="¿Darlo por terminado?"
          titleId="close-focus-title"
          busy={closing}
          error={closeError}
          confirmLabel="Cerrar"
          busyLabel="Cerrando…"
          onConfirm={onConfirmCloseFocus}
          onCancel={() => setClosingFocus(false)}
        >
          <p className="m-0 font-display text-[18px] leading-tight text-bone uppercase">
            {selectedFocus.name}
          </p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.14em] text-bone/60">
            NIVEL {selectedFocus.level} · {selectedFocus.currentXp} XP
          </p>
          <p className="mt-4 text-[11.5px] leading-relaxed text-bone/75">
            Deja de aceptar actividad y pasa a poder engendrar un foco hijo más
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

