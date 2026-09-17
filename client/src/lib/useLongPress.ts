import { useRef } from "react";

/**
 * Press-and-hold, in the "hold to delete" style of native apps. The app does
 * not need to be native: pointer events get you the same thing. The tricky
 * part is cancelling it properly, and there are four cases:
 *
 * 1. If the finger moves, it is a scroll and not a hold: cancel.
 * 2. Releasing after a long press still fires a click; if the element is a
 *    link, it would navigate. That click has to be swallowed.
 * 3. On Android, holding opens the system context menu on top.
 * 4. Holding over text selects it and pops up the magnifier (see the
 *    `long-pressable` class in index.css).
 *
 * It uses pointer events, so it works the same for touch, mouse and stylus.
 */
export function useLongPress(onHold: () => void, ms = 500) {
  const timer = useRef<number | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  function cancel() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    origin.current = null;
  }

  return {
    onPointerDown(e: React.PointerEvent) {
      fired.current = false;
      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        fired.current = true;
        cancel();
        onHold();
      }, ms);
    },

    onPointerMove(e: React.PointerEvent) {
      if (!origin.current) return;
      const dx = Math.abs(e.clientX - origin.current.x);
      const dy = Math.abs(e.clientY - origin.current.y);
      if (dx > 10 || dy > 10) cancel();
    },

    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,

    onClick(e: React.MouseEvent) {
      if (!fired.current) return;
      e.preventDefault();
      e.stopPropagation();
      fired.current = false;
    },

    onContextMenu(e: React.MouseEvent) {
      e.preventDefault();
    },
  };
}
