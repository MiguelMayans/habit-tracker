import { useEffect, type ReactNode } from "react";
import { useLocation, type Location } from "react-router-dom";

/**
 * The screen change: the new screen simply fades in, like turning a page.
 *
 * It used to be a black slab tearing across the screen and holding until the
 * data arrived. Spectacular, and exactly the kind of jolt this app no longer
 * wants. Screens now handle their own loading state (a quiet skeleton), so
 * there is nothing to wait for here.
 *
 * Keyed by pathname only: changing just the query string (?new=focus) is the
 * same screen, and does not fade.
 */
export function ScreenTransition({
  children,
}: {
  children: (location: Location) => ReactNode;
}) {
  const location = useLocation();

  // A new screen starts at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="screen-in">
      {children(location)}
    </div>
  );
}
