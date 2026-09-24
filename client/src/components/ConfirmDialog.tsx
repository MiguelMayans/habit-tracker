import { useEffect, useRef, type ReactNode } from "react";
import { DialogFrame } from "./DialogFrame";

/**
 * Generic confirmation for a destructive or irreversible action.
 *
 * The body — what is about to happen and what it costs — is decided by each
 * caller; this component only adds, on top of the shared frame, the initial
 * focus on Cancel and the two buttons.
 */
export function ConfirmDialog({
  bandTitle,
  titleId,
  children,
  busy,
  error,
  confirmLabel,
  busyLabel,
  onConfirm,
  onCancel,
}: {
  bandTitle: string;
  titleId: string;
  children: ReactNode;
  busy: boolean;
  error: string | null;
  confirmLabel: string;
  busyLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus starts on Cancel: the destructive action must not be the one that
  // fires when you hit Enter without looking.
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <DialogFrame titleId={titleId} bandTitle={bandTitle} onCancel={onCancel}>
      {children}

      {error && (
        <p className="anim-slam mt-4 bg-cuerpo px-3 py-2 text-[11px] font-bold text-bone">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className="slam-button flex-1"
          style={{ background: "var(--color-bone)" }}
        >
          <span>Cancelar</span>
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="slam-button flex-1"
          style={{
            background: "var(--color-cuerpo)",
            color: "var(--color-bone)",
          }}
        >
          <span>{busy ? busyLabel : confirmLabel}</span>
        </button>
      </div>
    </DialogFrame>
  );
}
