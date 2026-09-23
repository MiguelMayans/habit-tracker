import { useState } from "react";
import type { RecentActivity } from "../api/client";
import { dayKey, shortRelativeDate } from "../lib/dates";
import { XP_BY_INTENSITY } from "../lib/intensity";

const DAYS = 30;

/**
 * How strongly a day is tinted, based on the XP earned in it. The thresholds
 * come from what the intensities cost (10 / 20 / 35): under 20 is a single
 * gesture, 70 or more is a day with several things in it.
 *
 * Empty is not black but very faint bone: a gap has to read as a day that
 * existed and went unused, not as a hole in the strip.
 */
function tone(xp: number): string {
  if (xp === 0) return "rgb(245 245 240 / 0.12)";
  if (xp < 20) return "rgb(255 229 0 / 0.34)";
  if (xp < 40) return "rgb(255 229 0 / 0.58)";
  if (xp < 70) return "rgb(255 229 0 / 0.8)";
  return "var(--color-yellow)";
}

/**
 * The last 30 days, one square per day, brighter the more XP it holds.
 *
 * Every square is a button. Its only affordance used to be a `title`, which on
 * a phone never appears — so on the device this app is actually used on, the
 * thirty squares were decoration: you could see the shape but could not ask
 * what happened on a given day. Tapping one answers that in the strip's own
 * header, so nothing new is drawn on screen to say it.
 *
 * The bucketing happens here and not on the server for the same reason as the
 * streak: which calendar day a timestamp belongs to depends on the time zone,
 * which the browser knows and the server does not.
 */
export function RhythmStrip({
  activities,
  streak,
}: {
  activities: RecentActivity[];
  streak: number;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const xpByDay = new Map<string, number>();
  const countByDay = new Map<string, number>();
  for (const a of activities) {
    const key = dayKey(new Date(a.date));
    xpByDay.set(key, (xpByDay.get(key) ?? 0) + XP_BY_INTENSITY[a.intensity]);
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }

  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (DAYS - 1));

  const days = Array.from({ length: DAYS }, (_, i) => {
    const date = new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
    const key = dayKey(date);
    return {
      key,
      xp: xpByDay.get(key) ?? 0,
      count: countByDay.get(key) ?? 0,
      date,
      isToday: i === DAYS - 1,
    };
  });

  const open = days.find((d) => d.key === selected);
  // The label reuses the history's own wording, so a day is named the same
  // here as it is there: HOY, AYER or "12 SEP".
  const headline = open
    ? `${shortRelativeDate(open.date.toISOString())} · ${
        open.count === 0
          ? "SIN ACTIVIDAD"
          : `${open.count} ${open.count === 1 ? "ACTIVIDAD" : "ACTIVIDADES"} · +${open.xp} XP`
      }`
    : "ÚLTIMOS 30 DÍAS";

  return (
    <div
      className="anim-row mb-9"
      style={{ "--delay": "0.12s" } as React.CSSProperties}
    >
      <div className="mb-2 flex items-baseline gap-2 px-1">
        <span
          aria-live="polite"
          className={`text-[9px] font-bold tracking-[0.2em] ${
            open ? "text-bone" : "text-bone/50"
          }`}
        >
          {headline}
        </span>
        {streak > 0 && (
          // The streak used to live in its own ribbon up top, next to the
          // date. It moved here because it talks about exactly this strip:
          // keeping them apart said the same thing twice, in two visual
          // languages.
          <span className="ml-auto text-[9px] font-bold tracking-[0.16em] text-yellow">
            RACHA · {streak} {streak === 1 ? "DÍA" : "DÍAS"}
          </span>
        )}
      </div>

      <ul className="flex gap-[3px]">
        {days.map((d) => {
          const label = `${shortRelativeDate(d.date.toISOString())} · ${d.xp} XP`;
          return (
            <li key={d.key} className="flex-1">
              <button
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={d.key === selected}
                onClick={() =>
                  setSelected(d.key === selected ? null : d.key)
                }
                className="block aspect-square w-full"
                style={{
                  background: tone(d.xp),
                  // Today is marked even while still empty: it is the day you
                  // can still change, and without the mark it is lost among
                  // the gaps. The day you are inspecting gets a thicker ring
                  // of the same kind, so both marks read as one idea.
                  boxShadow:
                    d.key === selected
                      ? "inset 0 0 0 2.5px var(--color-yellow)"
                      : d.isToday
                        ? "inset 0 0 0 1.5px var(--color-bone)"
                        : undefined,
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
