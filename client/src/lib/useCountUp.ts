import { useEffect, useRef, useState } from "react";

/**
 * Counts from the previous value up to the new one, instead of swapping the
 * figure in one frame.
 *
 * XP is the reward this whole app is built on, and a number that simply
 * changes from 165 to 185 is not a reward — you have to notice it happened and
 * then work out what it was. Watching it climb IS the feedback.
 *
 * It eases out, so most of the travel happens immediately and the last few
 * points land slowly: the tail is the part that reads as arriving somewhere.
 *
 * `from` makes it start somewhere other than the current value, which is how
 * the result screen counts its headline up from zero on the first render.
 *
 * Respects `prefers-reduced-motion` by jumping straight to the value, because
 * the global CSS rule that kills animations cannot reach a number driven from
 * JavaScript.
 */
export function useCountUp(
  value: number,
  { ms = 700, from: desdeInicial }: { ms?: number; from?: number } = {},
): number {
  const arranque = desdeInicial ?? value;
  const [shown, setShown] = useState(arranque);
  const from = useRef(arranque);

  useEffect(() => {
    if (value === from.current) return;

    const quieto =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;

    if (quieto) {
      // The jump goes through a frame too: a synchronous setState inside an
      // effect chains renders, and oxlint rightly flags it.
      raf = requestAnimationFrame(() => {
        from.current = value;
        setShown(value);
      });
      return () => cancelAnimationFrame(raf);
    }

    const desde = from.current;
    const delta = value - desde;
    const inicio = performance.now();

    function paso(ahora: number) {
      const t = Math.min(1, (ahora - inicio) / ms);
      const suave = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(desde + delta * suave));

      if (t < 1) {
        raf = requestAnimationFrame(paso);
      } else {
        from.current = value;
      }
    }

    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);

  return shown;
}
