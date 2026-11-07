import { useState } from "react";
import type { RecentActivity } from "../api/client";
import { dayKey, shortRelativeDate } from "../lib/dates";
import { XP_BY_INTENSITY } from "../lib/intensity";

const DAYS = 30;

/**
 * How filled a day's dot is, from the XP earned in it. The thresholds come
 * from what the intensities cost (10 / 20 / 35): under 20 is a single
 * gesture, 70 or more is a full day. Ink at growing strength, never a bright
 * colour: this is a glance at your rhythm, not a scoreboard.
 */
function fill(xp: number): string {
  if (xp === 0) return "var(--color-mist)";
  if (xp < 20) return "rgb(46 42 37 / 0.22)";
  if (xp < 40) return "rgb(46 42 37 / 0.42)";
  if (xp < 70) return "rgb(46 42 37 / 0.65)";
  return "var(--color-ink)";
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
    <section className="card settle mb-8 px-5 py-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow m-0">Hoy</p>
          <p className="display mt-1 mb-0 text-[30px] leading-tight">
            {todayXp > 0 ? `+${todayXp} XP` : "Aún nada"}
          </p>
        </div>
        {streak > 0 && (
          <p className="m-0 text-right text-[13px] text-ink-soft">
            <b className="display block text-[30px] leading-tight font-medium text-ink">
              {streak}
            </b>
            {streak === 1 ? "día seguido" : "días seguidos"}
          </p>
        )}
      </div>

      <p aria-live="polite" className="mt-5 mb-2.5 text-[12px] text-ink-soft">
        {caption}
      </p>
      <ul className="m-0 flex list-none gap-[3px] p-0">
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
                className="block aspect-square w-full rounded-full"
                style={{
                  background: fill(d.xp),
                  // Today is marked even while empty: it is the day you can
                  // still change. The inspected day gets a stronger ring.
                  boxShadow:
                    d.key === selected
                      ? "0 0 0 2px var(--color-paper), 0 0 0 3.5px var(--color-ink)"
                      : d.isToday
                        ? "inset 0 0 0 1.5px var(--color-ink-faint)"
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
