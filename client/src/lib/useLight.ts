import { useEffect } from "react";

/**
 * Paints the backdrop's rays in the colour of whatever you are looking at.
 *
 * The burst lives in the layout (`App.tsx`), outside the routes, so a screen
 * cannot reach it through the tree: the variable is written on the document
 * root and inherits down from there. Leaving the screen removes it, and the
 * rays fall back to the home's red.
 */
export function useLight(color: string | null) {
  useEffect(() => {
    if (!color) return;

    const root = document.documentElement;
    root.style.setProperty("--light", color);
    return () => {
      root.style.removeProperty("--light");
    };
  }, [color]);
}
