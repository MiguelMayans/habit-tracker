/** Whole calendar days elapsed, ignoring the time of day. */
function calendarDaysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Whether `iso` falls on today's calendar day. Used to decide whether to offer
 * the undo action: the server has the final say (docs/DESIGN.md, the undo
 * exception), this only avoids showing a button that is already known to fail.
 */
export function isToday(iso: string): boolean {
  return calendarDaysBetween(new Date(iso), new Date()) <= 0;
}

/** Calendar-day key, for grouping dates while ignoring the time. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Consecutive days with at least one activity, ending today or yesterday. If
 * there is nothing today yet the day is not over — that is not a gap, and the
 * count starts from yesterday. Only a whole missed day breaks the streak.
 *
 * The server does not need this: these are dates the client already has in
 * hand, and the count depends on the user's time zone, which the browser knows
 * and the server does not.
 */
export function calculateStreak(isoDates: string[]): number {
  if (isoDates.length === 0) return 0;

  const days = new Set(isoDates.map((iso) => dayKey(new Date(iso))));

  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * The inactivity signal from docs/DESIGN.md: informative, never punitive. It
 * only says when the last time was, without scolding or taking anything away.
 */
export function sinceLastActivity(iso: string | null): {
  text: string;
  cold: boolean;
} {
  if (!iso) return { text: "SIN ACTIVIDAD", cold: false };

  const days = calendarDaysBetween(new Date(iso), new Date());

  if (days <= 0) return { text: "HOY", cold: false };
  if (days === 1) return { text: "AYER", cold: false };

  // Past a week it turns red: still a fact, not a warning.
  return { text: `HACE ${days} DÍAS`, cold: days >= 7 };
}

// Interface copy stays in Spanish: these strings are rendered to the user.
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function longDate(d: Date): string {
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

/**
 * For lists: recent entries read as relative time, which is how you remember
 * them, and past a week they switch to a date, which is the point where
 * "23 days ago" stops meaning anything.
 */
export function shortRelativeDate(iso: string): string {
  const d = new Date(iso);
  const days = calendarDaysBetween(d, new Date());

  if (days <= 0) return "HOY";
  if (days === 1) return "AYER";
  if (days < 7) return `HACE ${days} DÍAS`;

  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}`;
}
