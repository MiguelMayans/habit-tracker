import { useEffect, useRef, type ReactNode } from "react";
import { registerDialog } from "../lib/backToClose";

/**
 * The frame every dialog shares: a soft veil that closes on tap, Escape or the
 * phone's back button to close, and a paper sheet. On a phone the sheet rises from the bottom, where
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
  // Read through a ref: callers pass a new closure on every render, and the
  // dialog must register once.
  const cancel = useRef(onCancel);
  useEffect(() => {
    cancel.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") cancel.current();
    }
    window.addEventListener("keydown", onKey);
    const unregister = registerDialog(() => cancel.current());
    return () => {
      window.removeEventListener("keydown", onKey);
      unregister();
    };
  }, []);

  // Pulling the sheet down by its handle closes it, as the handle promises.
  const sheet = useRef<HTMLDivElement>(null);
  const dragFrom = useRef<number | null>(null);
  const handle = {
    onPointerDown(e: React.PointerEvent) {
      dragFrom.current = e.clientY;
      e.currentTarget.setPointerCapture(e.pointerId);
      if (sheet.current) sheet.current.style.transition = "none";
    },
    onPointerMove(e: React.PointerEvent) {
      if (dragFrom.current === null || !sheet.current) return;
      const dy = Math.max(0, e.clientY - dragFrom.current);
      sheet.current.style.transform = `translateY(${dy}px)`;
    },
    onPointerUp(e: React.PointerEvent) {
      if (dragFrom.current === null || !sheet.current) return;
      const dy = e.clientY - dragFrom.current;
      dragFrom.current = null;
      sheet.current.style.transition = "transform 0.2s ease-out";
      if (dy > 70) {
        sheet.current.style.transform = "translateY(100%)";
        window.setTimeout(() => cancel.current(), 160);
      } else {
        sheet.current.style.transform = "";
      }
    },
  };

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

      <div
        ref={sheet}
        className="sheet-in relative max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[28px] bg-paper px-6 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-[0_-8px_40px_rgb(46_42_37/0.12)] sm:rounded-[28px] sm:pt-6"
      >
        {/* The grab handle: a generous target around a small mark. */}
        <div
          {...handle}
          onPointerCancel={handle.onPointerUp}
          className="-mx-6 mb-2 flex touch-none justify-center pt-3 pb-3 sm:hidden"
          aria-hidden="true"
        >
          <i className="h-1 w-10 rounded-full bg-line" />
        </div>
        <h2 id={titleId} className="display m-0 mb-5 text-[24px] leading-tight">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
