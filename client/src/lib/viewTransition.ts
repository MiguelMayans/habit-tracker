import { flushSync } from "react-dom";

export const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Runs a state update inside a View Transition, so the browser animates the
 * DOM from how it was to how it ends up: an element with the same
 * `view-transition-name` before and after glides to its new place and size
 * (a ticked mission sliding down to "done", a category card growing into its
 * screen), anything that appears or goes cross-fades.
 *
 * `flushSync` makes React commit inside the callback, which is the moment the
 * browser takes its "after" picture. Where the API is missing, or motion is
 * reduced, the update simply happens.
 */
export function withViewTransition(
  update: () => void,
  /**
   * What kind of change this is, for index.css: a new screen (`page`, the
   * page cross-fades) or something moving inside the same screen (`list`,
   * the page stays put and only the named elements travel).
   */
  kind: "page" | "list" = "list",
) {
  if (!("startViewTransition" in document) || reducedMotion()) {
    update();
    return;
  }
  document.documentElement.dataset.nav = kind;
  document.startViewTransition(() => flushSync(update));
}

/**
 * A `view-transition-name`, as an inline style. `row` marks something that
 * travels within a list and must not be stretched on the way (index.css).
 */
export function vtName(name: string, kind?: "row"): React.CSSProperties {
  return {
    viewTransitionName: name,
    ...(kind ? { viewTransitionClass: kind } : {}),
  } as React.CSSProperties;
}
