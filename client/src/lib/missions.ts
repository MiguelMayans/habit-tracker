import type { Mission } from "../api/client";
import { isToday } from "./dates";
import { XP_BY_INTENSITY } from "./intensity";

/** What completing a mission with a category earns: a Chispa (docs/DESIGN.md). */
export const MISSION_XP = XP_BY_INTENSITY.chispa;

/**
 * Missions carry their due date as a local calendar day, "YYYY-MM-DD", never a
 * timestamp: "due today" has to mean today where the user is, and the browser
 * is the one that knows it. As plain strings in that format, days also sort
 * and compare correctly with `<`.
 */
export function localDay(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** The day `n` days after `day` (negative goes back). */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return localDay(new Date(y, m - 1, d + n));
}

function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  return Math.round(
    (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) /
      86_400_000,
  );
}

const WEEKDAYS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MONTHS = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

/**
 * How a due day reads: relative while it is close, which is how you think
 * about errands ("tomorrow", "Friday"), and a plain date beyond the week.
 */
export function dueLabel(day: string, today = localDay()): string {
  const diff = daysBetween(today, day);
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  if (diff === 0) return "HOY";
  if (diff === 1) return "MAÑANA";
  if (diff === -1) return "AYER";
  if (diff < 0) return `HACE ${-diff} DÍAS`;
  if (diff < 7) return `${WEEKDAYS[date.getDay()]} ${d}`;
  return `${d} ${MONTHS[m - 1]}`;
}

export type MissionGroup = "overdue" | "today" | "upcoming" | "someday" | "done";

export function missionGroup(m: Mission, today = localDay()): MissionGroup {
  if (m.completedAt !== null) return "done";
  if (m.dueDate === null) return "someday";
  if (m.dueDate < today) return "overdue";
  if (m.dueDate === today) return "today";
  return "upcoming";
}

/** What the home's button counts: what is due today or already late. */
export function urgentCount(missions: Mission[], today = localDay()): number {
  return missions.filter((m) => {
    const g = missionGroup(m, today);
    return g === "overdue" || g === "today";
  }).length;
}

/**
 * Whether ticking it off can be undone. A mission without XP always can; one
 * that logged a Chispa only on the day it was completed, like any other log
 * (docs/DESIGN.md). The server has the final say: this only avoids offering a
 * tap that is known to fail.
 */
export function canReopen(m: Mission): boolean {
  return m.completedAt !== null && (m.activityId === null || isToday(m.completedAt));
}

export type MissionKind = "call" | "paperwork" | "shopping";

// First words, without accents. Read off the title so nothing has to be
// classified by hand: it is decoration, and a wrong guess costs nothing.
const KINDS: [MissionKind, string[]][] = [
  ["call", ["llamar", "llama", "telefonear", "contestar", "whatsapp"]],
  [
    "paperwork",
    [
      "pagar", "pedir", "renovar", "solicitar", "tramitar", "enviar", "mandar",
      "firmar", "presentar", "reclamar", "rellenar", "devolver", "cancelar",
      "cita", "hacienda", "banco",
    ],
  ],
  ["shopping", ["comprar", "recoger", "encargar"]],
];

export function missionKind(title: string): MissionKind | null {
  const first = title
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (!first) return null;

  for (const [kind, words] of KINDS) {
    if (words.includes(first)) return kind;
  }
  return null;
}
