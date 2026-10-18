import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMissions } from "../api/client";
import { urgentCount } from "../lib/missions";
import { MissionsGlyph } from "./MissionIcons";
import { LairGlyph } from "./WorkIcons";

/**
 * The floating bar along the bottom, on every screen: the missions on the
 * left, logging in the middle — still the main action, so it is the one that
 * sticks up out of the bar in yellow — and the Lair on the right.
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
    <nav className="bottom-nav" aria-label="Principal">
      <div className="bottom-nav-bar" />

      <Link to="/missions" className="nav-tab" aria-current={current("/missions")}>
        <span className="relative">
          <MissionsGlyph className="h-[22px] w-[22px]" />
          {urgent > 0 && (
            <span className="nav-badge" aria-label={`${urgent} para hoy`}>
              <b>{urgent}</b>
            </span>
          )}
        </span>
        <span className="nav-tab-label">Misiones</span>
      </Link>

      <Link
        to={logTarget}
        className="nav-log"
        aria-current={current("/log-activity")}
      >
        {/* The clip lives on this layer and not on the link, because
            `clip-path` also clips the `box-shadow` — and that is what beats. */}
        <span className="pill-cut absolute inset-0 bg-yellow" />
        <span className="relative flex items-baseline gap-1.5 font-display text-[14px] leading-none text-black uppercase">
          <b className="text-[18px] leading-none">+</b>
          Registrar
        </span>
      </Link>

      <Link to="/lair" className="nav-tab" aria-current={current("/lair")}>
        <LairGlyph className="h-[22px] w-[26px]" />
        <span className="nav-tab-label">Guarida</span>
      </Link>
    </nav>
  );
}
