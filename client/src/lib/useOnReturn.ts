import { useEffect, useRef } from "react";

/** Below this, coming back is a glance at another app, not a return. */
const MIN_AWAY_MS = 30_000;

/**
 * Runs `callback` when the app comes back to the foreground after a while
 * away. An installed PWA can stay open for days: without this, the home kept
 * yesterday's date, greeting and "today" until something else reloaded it.
 */
export function useOnReturn(callback: () => void) {
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  useEffect(() => {
    let hiddenAt = 0;
    function onChange() {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt > MIN_AWAY_MS) {
        latest.current();
      }
    }
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
}
