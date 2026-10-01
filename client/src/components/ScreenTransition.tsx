import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, type Location } from "react-router-dom";
import { ReadyContext } from "../lib/screenReady";

/** How deep a screen sits, to tell going in from coming back. */
function depth(pathname: string): number {
  if (pathname === "/") return 0;
  if (/^\/categories\/\d+\/history$/.test(pathname)) return 2;
  return 1;
}

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Timings, in ms. The cover ends with the slab flush on screen. */
const COVER_MS = 230;
const REVEAL_MS = 300;
/** The longest the slab waits for a screen's data before giving up. */
const HOLD_MAX_MS = 2500;

type Phase = "idle" | "cover" | "hold" | "reveal";

/**
 * The screen change, as Persona does it: a black slab with a red leading
 * edge tears across the screen, covers it, and the new screen is revealed as
 * the slab carries on out the other side. Going deeper it sweeps left to
 * right; coming back it sweeps the other way, so the direction says where you
 * are going.
 *
 * The swap happens while the screen is covered: the routes render the
 * PREVIOUS location until the slab is flush, so you never see the old screen
 * vanish nor the new one pop in. Then, if the new screen is loading, the slab
 * holds (see useScreenReady).
 *
 * Changing only the query string (?new=focus and friends) is the same screen,
 * and does not wipe.
 */
export function ScreenTransition({
  children,
}: {
  children: (location: Location) => ReactNode;
}) {
  const location = useLocation();
  const [shown, setShown] = useState(location);
  const [phase, setPhase] = useState<Phase>("idle");
  const [direction, setDirection] = useState<1 | -1>(1);
  const latest = useRef(location);
  const phaseRef = useRef<Phase>("idle");
  // Whether the screen on display is still waiting for its data. Written by
  // the screen's own effect, which React runs before this component's.
  const pending = useRef(false);

  useEffect(() => {
    latest.current = location;
  }, [location]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Reacting to the route changing is done during render, React's pattern
  // for adjusting state to a new prop, rather than in an effect.
  if (location !== shown && phase === "idle") {
    if (location.pathname === shown.pathname || reducedMotion()) {
      setShown(location);
    } else {
      setDirection(
        depth(location.pathname) < depth(shown.pathname) ? -1 : 1,
      );
      setPhase("cover");
    }
  }

  const report = useCallback((ready: boolean) => {
    pending.current = !ready;
    if (ready && phaseRef.current === "hold") setPhase("reveal");
  }, []);

  // A new screen starts at the top. With the wipe this runs right after the
  // swap, while the slab still covers everything.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [shown.pathname]);

  useEffect(() => {
    let t: number | undefined;
    let frame: number | undefined;

    if (phase === "cover") {
      t = window.setTimeout(() => {
        pending.current = false;
        setShown(latest.current);
        setPhase("hold");
      }, COVER_MS);
    } else if (phase === "hold") {
      // By the next frame the new screen has mounted and said whether it is
      // loading. If it is not, there is nothing to wait for.
      frame = requestAnimationFrame(() => {
        if (!pending.current) setPhase("reveal");
      });
      t = window.setTimeout(() => setPhase("reveal"), HOLD_MAX_MS);
    } else if (phase === "reveal") {
      t = window.setTimeout(() => setPhase("idle"), REVEAL_MS);
    }

    return () => {
      if (t !== undefined) window.clearTimeout(t);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [phase]);

  return (
    <ReadyContext.Provider value={report}>
      {children(shown)}

      {phase !== "idle" &&
        // Through a portal: rendered here it would live inside <main>, whose
        // own z-index caps it, and the log button would show on top of it.
        // It also swallows taps while it runs: a second tap mid-wipe would
        // start another navigation under the slab.
        createPortal(
          <div
            className={`wipe wipe-${phase}`}
            data-direction={direction}
            aria-hidden="true"
          >
            <i className="wipe-edge" />
            <i className="wipe-slab">
              <span className="wipe-star" />
            </i>
          </div>,
          document.body,
        )}
    </ReadyContext.Provider>
  );
}
