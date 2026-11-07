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
    <DialogFrame titleId="mission-sheet-title" title="Editar misión" onCancel={onCancel}>
      <form
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ title, dueDate: due, categoryId });
        }}
      >
        <input
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Título"
          maxLength={200}
          autoFocus
        />

        <WhenPicker value={due} onChange={setDue} />

        {/* Its XP already went to the category it had: the server refuses a
            move, so the picker does not pretend otherwise. */}
        <CategoryOptions
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          disabled={done}
        />

        {error && <p className="m-0 text-[14px] text-warn">{error}</p>}

        <div className="mt-2 grid gap-3">
          <button
            type="submit"
            disabled={busy || title.trim() === ""}
            className="btn w-full"
          >
            {busy ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" onClick={onDelete} className="btn btn-danger w-full">
            Borrar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="link-quiet mt-1 justify-self-center"
          >
            Cancelar
          </button>
        </div>
      </form>
    </DialogFrame>
  );
}
