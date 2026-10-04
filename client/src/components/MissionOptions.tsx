import { useRef } from "react";
import type { Category } from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { addDays, dueLabel, localDay, MISSION_XP } from "../lib/missions";
import { CategoryIcon } from "./CategoryIcon";

/**
 * When a mission is due: today, tomorrow, or a day from the calendar. Tapping
 * the chip that is already on clears it — no date at all is a valid answer,
 * and the most common one for "someday" errands.
 */
export function WhenPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (day: string | null) => void;
}) {
  const today = localDay();
  const tomorrow = addDays(today, 1);
  const dateRef = useRef<HTMLInputElement>(null);
  const custom = value !== null && value !== today && value !== tomorrow;

  const toggle = (day: string) => onChange(value === day ? null : day);

  function openCalendar() {
    if (custom) {
      onChange(null);
      return;
    }
    const input = dateRef.current;
    if (!input) return;
    // The system calendar is the one native piece left: on a phone it is the
    // picker the thumb already knows, and drawing a calendar is not the point.
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        className="option-chip"
        aria-pressed={value === today}
        onClick={() => toggle(today)}
      >
        <span>Hoy</span>
      </button>
      <button
        type="button"
        className="option-chip"
        aria-pressed={value === tomorrow}
        onClick={() => toggle(tomorrow)}
      >
        <span>Mañana</span>
      </button>
      <span className="relative">
        <button
          type="button"
          className="option-chip"
          aria-pressed={custom}
          onClick={openCalendar}
        >
          <span>{custom ? dueLabel(value) : "Fecha…"}</span>
        </button>
        <input
          ref={dateRef}
          type="date"
          min={today}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0"
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
        />
      </span>
    </div>
  );
}

/**
 * The category a mission counts toward, if any. Picking one is what makes
 * completing it worth a Chispa; tapping it again leaves the mission as a plain
 * errand.
 */
export function CategoryOptions({
  categories,
  value,
  onChange,
  disabled = false,
}: {
  categories: Category[];
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
}) {
  const picked = categories.find((c) => c.id === value);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2.5">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className="mission-cat disabled:opacity-40"
            aria-pressed={value === c.id}
            aria-label={c.name}
            disabled={disabled}
            onClick={() => onChange(value === c.id ? null : c.id)}
            style={
              { "--accent": categoryColorVar(c.slug) } as React.CSSProperties
            }
          >
            <CategoryIcon slug={c.slug} strokeWidth={2.4} className="h-5 w-5" />
          </button>
        ))}
      </div>
      <p className="on-scene m-0 w-fit text-[10px] font-bold tracking-[0.12em] text-bone/75">
        {picked ? (
          <>
            AL CUMPLIRLA:{" "}
            <b style={{ color: categoryColorVar(picked.slug) }}>
              +{MISSION_XP} XP EN {picked.name.toUpperCase()}
            </b>
          </>
        ) : (
          `CON CATEGORÍA, +${MISSION_XP} XP AL CUMPLIRLA`
        )}
      </p>
    </div>
  );
}
