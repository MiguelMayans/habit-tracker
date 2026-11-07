import { useEffect, useRef } from "react";
import type { Focus } from "../api/client";
import { DialogFrame } from "./DialogFrame";

/**
 * Everything you can do TO a focus, as opposed to logging on it.
 *
 * Tapping a focus logs; holding it — or its "···" button, which is the same
 * thing for anyone who does not know to hold — opens this. Renaming, closing
 * and deleting used to be three loose lowercase links crowding the level on
 * every tile, plus a line of instructions explaining the gestures. Gathered
 * here they cost nothing until you want them.
 *
 * Closing and deleting still go through their own confirmation: this sheet
 * only chooses what to do, it never does anything irreversible by itself.
 */
export function FocusMenu({
  focus: f,
  busy,
  error,
  onRename,
  onClose,
  onReopen,
  onDelete,
  onCancel,
}: {
  focus: Focus;
  busy: boolean;
  error: string | null;
  onRename: () => void;
  onClose: () => void;
  onReopen: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  return (
    <DialogFrame titleId="focus-menu-title" title={f.name} onCancel={onCancel}>
      <p className="m-0 -mt-3 mb-6 text-[14px] text-ink-soft">
        Nivel {f.level} · {f.currentXp} XP
      </p>

      <div className="grid gap-3">
        <button
          ref={firstRef}
          type="button"
          onClick={onRename}
          className="btn btn-soft w-full"
        >
          Renombrar
        </button>

        {/* Mastery does not reopen: it was earned. A manual close does,
            because it is a decision, and decisions change. */}
        {!f.atMaxLevel &&
          (f.frozen ? (
            <button
              type="button"
              onClick={onReopen}
              disabled={busy}
              className="btn btn-soft w-full"
            >
              {busy ? "Reabriendo…" : "Reabrir"}
            </button>
          ) : (
            <button type="button" onClick={onClose} className="btn btn-soft w-full">
              Dar por terminado
            </button>
          ))}

        <button type="button" onClick={onDelete} className="btn btn-danger w-full">
          Borrar
        </button>

        {error && <p className="m-0 text-[14px] text-warn">{error}</p>}

        <button type="button" onClick={onCancel} className="link-quiet mt-1 justify-self-center">
          Cancelar
        </button>
      </div>
    </DialogFrame>
  );
}
