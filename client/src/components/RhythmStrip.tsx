import { useState } from "react";
import type { RecentActivity } from "../api/client";
import { dayKey, shortRelativeDate } from "../lib/dates";
import { XP_BY_INTENSITY } from "../lib/intensity";

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
    : "Últimos 30 días";

  return (
    <section className="card-ink settle mb-8 px-5 py-5">
      {/* The light of the hour, caught in the dark card's corner. */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-30 blur-2xl"
        style={{ background: "var(--glow)" }}
        aria-hidden="true"
      />

      <div className="relative flex items-end justify-between gap-4">
        <div>
          <p className="m-0 text-[12px] font-semibold tracking-wide text-paper/60">Hoy</p>
          <p className="display mt-1 mb-0 text-[36px] leading-none">
            {todayXp > 0 ? `+${todayXp} XP` : "Aún nada"}
          </p>
        </div>
        {streak > 0 && (
          <div className="text-right">
            <p className="m-0 flex items-center justify-end gap-1.5">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#f6cf86]" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12.6 2.5c.4 3-1.6 4.6-3 6.3C8 10.6 7 12.2 7 14.6A5 5 0 0 0 12 19.5a5 5 0 0 0 5-5c0-2.2-1-3.6-1.8-4.6-.3 1.3-1 2.1-1.9 2.4.6-3.6-.2-6.6-.7-9.8Z"
                />
              </svg>
              <b className="display text-[36px] leading-none font-medium">{streak}</b>
            </p>
            <p className="mt-1 mb-0 text-[12px] text-paper/60">
              {streak === 1 ? "día seguido" : "días seguidos"}
            </p>
          </div>
        )}
      </div>

      <p aria-live="polite" className="relative mt-6 mb-2.5 text-[12px] text-paper/60">
        {caption}
      </p>
      <ul className="relative m-0 flex list-none gap-[3px] p-0">
        {days.map((d, i) => {
          const label = `${shortRelativeDate(d.date.toISOString())}: ${d.xp} XP`;
          return (
            <li
              key={d.key}
              className="settle flex-1"
              style={{ "--delay": `${0.2 + i * 0.015}s` } as React.CSSProperties}
            >
              <button
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={d.key === selected}
                onClick={() => setSelected(d.key === selected ? null : d.key)}
                className="block aspect-square w-full rounded-full"
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
    </section>
  );
}
