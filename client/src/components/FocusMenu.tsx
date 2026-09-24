import { useEffect, useRef } from "react";
import type { Focus } from "../api/client";
import { DialogFrame } from "./DialogFrame";
import { LevelNumber } from "./LevelNumber";

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
  accent,
  busy,
  error,
  onRename,
  onClose,
  onReopen,
  onDelete,
  onCancel,
}: {
  focus: Focus;
  accent: string;
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
    <DialogFrame
      titleId="focus-menu-title"
      bandTitle={f.name}
      band={accent}
      onCancel={onCancel}
    >
      <div className="mb-5 flex items-center gap-3">
        <LevelNumber value={f.level} size={34} />
        <span className="ml-auto text-[10px] font-bold tracking-[0.14em] text-bone/60">
          {f.currentXp} XP
        </span>
      </div>

      <div className="grid gap-3">
        <button
          ref={firstRef}
          type="button"
          onClick={onRename}
          className="slam-button w-full"
          style={{ background: "var(--color-bone)" }}
        >
          <span>Renombrar</span>
        </button>

        {/* Mastery does not reopen: it was earned. A manual close does,
            because it is a decision, and decisions change. */}
        {!f.atMaxLevel &&
          (f.frozen ? (
            <button
              type="button"
              onClick={onReopen}
              disabled={busy}
              className="slam-button w-full"
            >
              <span>{busy ? "Reabriendo…" : "Reabrir"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="slam-button w-full"
              style={{ background: "var(--color-bone)" }}
            >
              <span>Dar por terminado</span>
            </button>
          ))}

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

        {error && (
          <p className="anim-slam m-0 bg-cuerpo px-3 py-2 text-[11px] font-bold text-bone">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="mt-1 text-[10px] font-bold tracking-[0.16em] text-bone/60 underline"
        >
          CANCELAR
        </button>
      </div>
    </DialogFrame>
  );
}
