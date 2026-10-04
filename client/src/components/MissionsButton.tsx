import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMissions } from "../api/client";
import { urgentCount } from "../lib/missions";
import { MissionsGlyph } from "./MissionIcons";

/**
 * The way into the missions, top right of the home, with what is due today
 * or already late as a badge.
 *
 * It fetches on its own instead of joining the home's load: the home is about
 * the categories, and a failure here should cost a badge, not the screen.
 */
export function MissionsButton() {
  const [urgent, setUrgent] = useState(0);

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
  }, []);

  return (
    <Link
      to="/missions"
      className="missions-button anim-ribbon"
      aria-label={
        urgent > 0 ? `Misiones: ${urgent} para hoy` : "Misiones"
      }
    >
      <MissionsGlyph className="h-[22px] w-[22px]" />
      <span className="text-[8px] leading-none font-bold tracking-[0.16em]">
        MISIONES
      </span>
      {urgent > 0 && (
        <span className="missions-badge" aria-hidden="true">
          <b>{urgent}</b>
        </span>
      )}
    </Link>
  );
}
