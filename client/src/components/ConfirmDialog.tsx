import { useEffect, useRef, type ReactNode } from "react";

/**
 * Generic confirmation for a destructive or irreversible action. It does not
 * use the browser's `confirm()`: that would break the app's tone, and in an
 * installed PWA it shows up as a box that belongs to someone else.
 *
 * The body — what is about to happen and what it costs — is decided by each
 * caller; this component only provides the frame: title band, initial focus on
 * Cancel, Escape to close, and the two buttons.
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

  // Escape closes, and focus starts on Cancel: the destructive action must not
  // be the one that fires when you hit Enter without looking.
  useEffect(() => {
    cancelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Cancelar"
        onClick={onCancel}
        className="absolute inset-0 bg-black/80"
      />

      <div
        className="anim-slam relative w-full max-w-sm bg-black"
        style={{ boxShadow: "9px 9px 0 var(--color-cuerpo)" }}
      >
        <div className="bg-cuerpo px-4 py-2.5">
          <h2
            id={titleId}
            className="text-outline m-0 font-display text-[16px] text-bone uppercase"
          >
            {bandTitle}
          </h2>
        </div>

        <div className="px-4 py-4">
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
        </div>
      </div>
    </div>
  );
}
