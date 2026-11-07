import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMissions } from "../api/client";
import { urgentCount } from "../lib/missions";
import { MissionsGlyph } from "./MissionIcons";
import { HomeGlyph, LairGlyph } from "./WorkIcons";
import { vtName } from "../lib/viewTransition";

/**
 * The floating bar along the bottom, on every screen: a glass pill with the
 * three places — home, missions, refuge — and, apart from it, the round
 * button to log, the main action. Home used to be missing from the bar: from
 * the missions or the refuge the only way back was the phone's own gesture.
 *
 * Logging carries context along, as the old floating button did: from inside
 * a category, the form opens with it already chosen.
 */
export function BottomNav() {
  const { pathname } = useLocation();
  const [urgent, setUrgent] = useState(0);

  // Refreshed on every screen change: tick off a mission and come back, and
  // the badge has to have caught up. It is one small request, and a failure
  // costs only the badge.
  useEffect(() => {
    let cancelled = false;
    getMissions()
      .then((missions) => {
        if (!cancelled) setUrgent(urgentCount(missions));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const inCategory = pathname.match(/^\/categories\/(\d+)$/);
  const logTarget = inCategory
    ? `/log-activity?category=${inCategory[1]}`
    : "/log-activity";

  const current = (path: string) =>
    pathname === path ? ("page" as const) : undefined;

  return (
    <nav className="bottom-nav" aria-label="Principal" style={vtName("nav")}>
      <div className="nav-pill">
        <Link to="/" className="nav-tab" aria-current={current("/")}>
          <HomeGlyph className="h-[22px] w-[22px]" />
          Inicio
        </Link>

        <Link to="/missions" className="nav-tab" aria-current={current("/missions")}>
          <span className="relative">
            <MissionsGlyph className="h-[22px] w-[22px]" />
            {urgent > 0 && (
              <span className="nav-badge" aria-label={`${urgent} para hoy`}>
                {urgent}
              </span>
            )}
          </span>
          Misiones
        </Link>

        <Link to="/lair" className="nav-tab" aria-current={current("/lair")}>
          <LairGlyph className="h-[22px] w-[22px]" />
          Refugio
        </Link>
      </div>

      <Link
        to={logTarget}
        className="nav-log"
        aria-current={current("/log-activity")}
        aria-label="Registrar"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    </nav>
  );
}
