import { useEffect, useState, type ReactNode } from "react";
import { useLocation, type Location } from "react-router-dom";
import { withViewTransition, reducedMotion } from "../lib/viewTransition";

const supported = () => "startViewTransition" in document && !reducedMotion();

/**
 * The screen change, as a View Transition: the page cross-fades, short, and
 * whatever exists on both screens under the same `view-transition-name`
 * travels between them — a category's ring flies from its row on the home
 * to the head of its screen. The bottom bar, named too, stays still.
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
    withViewTransition(() => {
      setShown(location);
      // A new screen starts at the top — under the transition, so the
      // "after" picture is already scrolled.
      window.scrollTo(0, 0);
    }, "page");
  }, [location, shown]);

  // Without the API the scroll reset still has to happen.
  useEffect(() => {
    if (!supported()) window.scrollTo(0, 0);
  }, [shown.pathname]);

  return <>{children(shown)}</>;
}
