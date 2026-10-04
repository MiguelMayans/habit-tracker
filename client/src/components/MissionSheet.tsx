import { useState } from "react";
import type { Category, Mission, MissionFields } from "../api/client";
import { CategoryOptions, WhenPicker } from "./MissionOptions";
import { DialogFrame } from "./DialogFrame";

/**
 * Editing a mission: the same three things you set when jotting it down, plus
 * the way to delete it. Deleting still goes through its own confirmation —
 * this sheet only chooses, like the focus menu.
 */
export function MissionSheet({
  mission: m,
  categories,
  busy,
  error,
  onSave,
  onDelete,
  onCancel,
}: {
  mission: Mission;
  categories: Category[];
  busy: boolean;
  error: string | null;
  onSave: (changes: MissionFields) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(m.title);
  const [due, setDue] = useState(m.dueDate);
  const [categoryId, setCategoryId] = useState(m.categoryId);
  const done = m.completedAt !== null;

  return (
    <DialogFrame
      titleId="mission-sheet-title"
      bandTitle="Misión"
      band="var(--color-yellow)"
      onCancel={onCancel}
    >
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ title, dueDate: due, categoryId });
        }}
      >
        <div className="field-frame">
          <input
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Título"
            maxLength={200}
            autoFocus
          />
        </div>

        <WhenPicker value={due} onChange={setDue} />

        {/* Its XP already went to the category it had: the server refuses a
            move, so the picker does not pretend otherwise. */}
        <CategoryOptions
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          disabled={done}
        />

        {error && (
          <p className="anim-slam m-0 bg-cuerpo px-3 py-2 text-[11px] font-bold text-bone">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || title.trim() === ""}
          className="slam-button mt-1 w-full"
        >
          <span>{busy ? "Guardando…" : "Guardar"}</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="slam-button w-full"
          style={{
            background: "var(--color-cuerpo)",
            color: "var(--color-bone)",
          }}
        >
          <span>Borrar</span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="mt-1 text-[10px] font-bold tracking-[0.16em] text-bone/60 underline"
        >
          CANCELAR
        </button>
      </form>
    </DialogFrame>
  );
}
