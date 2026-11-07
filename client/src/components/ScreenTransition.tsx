import { useEffect, useState, type ReactNode } from "react";
import { useLocation, type Location } from "react-router-dom";
import { withViewTransition, reducedMotion } from "../lib/viewTransition";

/** How deep a screen sits, to tell going in from coming back. */
function depth(pathname: string): number {
  if (/^\/categories\/\d+\/history$/.test(pathname)) return 2;
  if (/^\/categories\/\d+$/.test(pathname) || pathname === "/log-activity") return 1;
  return 0;
}

const supported = () => "startViewTransition" in document && !reducedMotion();

/**
 * The screen change, as a View Transition: going deeper the new screen
 * drifts in from the right, coming back from the left, and between the
 * tabs (home, missions, refuge) it cross-fades. Elements that exist on both
 * screens under the same `view-transition-name` travel between them — a
 * category card grows into its screen's header — and the bottom bar, named
 * too, stays still.
 *
 * The routes render `shown`, which lags the real location by one swap: the
 * browser takes its "before" picture of the old screen, then the swap
 * happens inside the transition.
 *
 * Changing only the query string (?new=focus) is the same screen: no
 * transition.
 */
export function ScreenTransition({
  children,
}: {
  children: (location: Location) => ReactNode;
}) {
  const location = useLocation();
  const [shown, setShown] = useState(location);

  // Without the API there is nothing to wait for: adjust during render.
  if (location !== shown && (!supported() || location.pathname === shown.pathname)) {
    setShown(location);
  }

  useEffect(() => {
    if (location === shown) return;
    const from = depth(shown.pathname);
    const to = depth(location.pathname);

    withViewTransition(
      () => {
        setShown(location);
        // A new screen starts at the top — under the transition, so the
        // "after" picture is already scrolled.
        window.scrollTo(0, 0);
      },
      to > from ? "forward" : to < from ? "back" : "fade",
    );
  }, [location, shown]);

  // Without the API the scroll reset still has to happen.
  useEffect(() => {
    if (!supported()) window.scrollTo(0, 0);
  }, [shown.pathname]);

  return <>{children(shown)}</>;
}
