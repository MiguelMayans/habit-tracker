import { useState } from "react";
import type { RecentActivity } from "../api/client";
import { dayKey, shortRelativeDate } from "../lib/dates";
import { XP_BY_INTENSITY } from "../lib/intensity";
import { useCountUp } from "../lib/useCountUp";

const DAYS = 30;

/**
 * How filled a day's dot is, from the XP earned in it. The thresholds come
 * from what the intensities cost (10 / 20 / 35): under 20 is a single
 * gesture, 70 or more is a full day. Honey at growing strength on the dark
 * card, like lamps lit along a street.
 */
function fill(xp: number): string {
  if (xp === 0) return "rgb(251 248 242 / 0.12)";
  if (xp < 20) return "rgb(242 200 120 / 0.4)";
  if (xp < 40) return "rgb(242 200 120 / 0.62)";
  if (xp < 70) return "rgb(242 200 120 / 0.85)";
  return "#f6cf86";
}

/**
 * Today at a glance: what today is worth, the streak, and the last 30 days
 * as a row of dots. Tapping a dot says what happened that day, in the card's
 * own header line.
 *
 * Days are bucketed here and not on the server: which calendar day a
 * timestamp belongs to depends on the time zone, which only the browser knows.
 */
export function RhythmStrip({
  activities,
  streak,
  todayXp,
}: {
  activities: RecentActivity[];
  streak: number;
  todayXp: number;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const shownXp = useCountUp(todayXp);
  const shownStreak = useCountUp(streak);

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
  const caption = open
    ? `${shortRelativeDate(open.date.toISOString())} · ${
        open.count === 0
          ? "sin actividad"
          : `${open.count} ${open.count === 1 ? "actividad" : "actividades"}, +${open.xp} XP`
      }`
    : "";

  return (
    <section className="card-ink mb-8 px-4 pt-3.5 pb-4">
      {/* The light of the hour, caught in the dark card's corner. */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-25 blur-2xl"
        style={{ background: "var(--glow)" }}
        aria-hidden="true"
      />

      <div className="relative flex items-baseline justify-between gap-4">
        <p className="m-0 flex items-baseline gap-2">
          <span className="text-[12px] font-semibold text-paper/60">Hoy</span>
          <span className="display text-[22px] leading-none">
            {todayXp > 0 ? `+${shownXp} XP` : "aún nada"}
          </span>
        </p>
        {streak > 0 && (
          <p className="m-0 flex items-center gap-1 text-[12px] text-paper/60">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#f6cf86]" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12.6 2.5c.4 3-1.6 4.6-3 6.3C8 10.6 7 12.2 7 14.6A5 5 0 0 0 12 19.5a5 5 0 0 0 5-5c0-2.2-1-3.6-1.8-4.6-.3 1.3-1 2.1-1.9 2.4.6-3.6-.2-6.6-.7-9.8Z"
              />
            </svg>
            <b className="display text-[18px] leading-none font-medium text-paper">
              {shownStreak}
            </b>
            {streak === 1 ? "día" : "días"}
          </p>
        )}
      </div>

      <ul className="relative m-0 mt-3 flex list-none gap-[3px] p-0" aria-label="Últimos 30 días">
        {days.map((d) => {
          const label = `${shortRelativeDate(d.date.toISOString())}: ${d.xp} XP`;
          return (
            <li key={d.key} className="flex-1">
              <button
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={d.key === selected}
                onClick={() => setSelected(d.key === selected ? null : d.key)}
                className="day-dot"
                style={{
                  background: fill(d.xp),
                  // Today is marked even while empty: it is the day you can
                  // still change. The inspected day gets a stronger ring.
                  boxShadow:
                    d.key === selected
                      ? "0 0 0 2px var(--color-ink), 0 0 0 3.5px var(--color-paper)"
                      : d.isToday
                        ? "inset 0 0 0 1.5px rgb(251 248 242 / 0.7)"
                        : undefined,
                }}
              />
            </li>
          );
        })}
      </ul>
      {/* What a tapped day holds, only when you ask. */}
      {open && (
        <p aria-live="polite" className="relative mt-2.5 mb-0 text-[12px] text-paper/70">
          {caption}
        </p>
      )}
    </section>
  );
}
