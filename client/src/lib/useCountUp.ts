import { useEffect, useRef, useState } from "react";
import { reducedMotion } from "./viewTransition";

/**
 * A figure that counts to its value instead of appearing — the first time
 * from zero, afterwards from wherever it was. Eased out, so it slows into the
 * number: arriving, not ticking.
 */
export function useCountUp(target: number, ms = 900): number {
  const [shown, setShown] = useState(() => (reducedMotion() ? target : 0));
  const from = useRef(shown);

  useEffect(() => {
    if (reducedMotion()) {
      from.current = target;
      const raf = requestAnimationFrame(() => setShown(target));
      return () => cancelAnimationFrame(raf);
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(origin + (target - origin) * eased);
      setShown(value);
      from.current = value;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return shown;
}
