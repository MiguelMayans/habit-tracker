import { useEffect, type ReactNode } from "react";

/**
 * The frame every dialog shares: a soft veil that closes on tap, Escape to
 * close, and a paper sheet. On a phone the sheet rises from the bottom, where
 * the thumb already is; on a wide screen it sits centred.
 *
 * It does not use the browser's `confirm()`: in an installed PWA that shows up
 * as a box that belongs to someone else.
 */
export function DialogFrame({
  titleId,
  title,
  onCancel,
  children,
}: {
  titleId: string;
  title: string;
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
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Cancelar"
        onClick={onCancel}
        className="veil-in absolute inset-0 bg-ink/25"
      />

      <div className="sheet-in relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-paper px-6 pt-3 pb-8 shadow-[0_-8px_40px_rgb(46_42_37/0.12)] sm:rounded-[28px] sm:pt-6">
        {/* The grab handle: says "this is a sheet" without words. */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line sm:hidden" />
        <h2 id={titleId} className="display m-0 mb-5 text-[24px] leading-tight">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
