import { useEffect } from "react";

/**
 * Tints the scene's light beam with the colour of whatever you are looking at.
 *
 * The beam lives in the layout (`App.tsx`), outside the routes, so a screen
 * cannot reach it through the tree: the variable is written on the document
 * root and inherits down from there. Leaving the screen removes it, and the
 * beam falls back to bone.
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
