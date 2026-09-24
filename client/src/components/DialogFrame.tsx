import { useEffect, type ReactNode } from "react";

/**
 * The frame every dialog in the app shares: the dimmed backdrop that closes
 * on tap, Escape to close, and a black panel under a coloured title band.
 *
 * It does not use the browser's `confirm()`: that would break the app's tone,
 * and in an installed PWA it shows up as a box that belongs to someone else.
 */
export function DialogFrame({
  titleId,
  bandTitle,
  band = "var(--color-cuerpo)",
  onCancel,
  children,
}: {
  titleId: string;
  bandTitle: string;
  /** Band and shadow colour. Red by default: most dialogs are destructive. */
  band?: string;
  onCancel: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
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
        style={{ boxShadow: `9px 9px 0 ${band}` }}
      >
        <div className="px-4 py-2.5" style={{ background: band }}>
          <h2
            id={titleId}
            className="text-outline m-0 font-display text-[16px] text-bone uppercase"
          >
            {bandTitle}
          </h2>
        </div>

        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
