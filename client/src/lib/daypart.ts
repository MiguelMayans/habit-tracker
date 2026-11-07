import { season } from "./season";

/** Whose app this is: the greeting speaks to him by name. */
const NAME = "Miguel";

export type Daypart = "morning" | "afternoon" | "evening" | "night";

export function daypart(d = new Date()): Daypart {
  const h = d.getHours();
  if (h >= 6 && h < 13) return "morning";
  if (h >= 13 && h < 20) return "afternoon";
  if (h >= 20) return "evening";
  return "night";
}

/**
 * A few lines per part of the day, the way a friend would say hello rather
 * than a dashboard. Gentle on purpose: none of them asks for anything.
 */
const PHRASES: Record<Daypart, string[]> = {
  morning: [
    `Buenos días, ${NAME}`,
    `¿Qué tal has dormido, ${NAME}?`,
    `Café y a por el día, ${NAME}`,
    `Sin prisa, ${NAME}`,
  ],
  afternoon: [
    `Buenas tardes, ${NAME}`,
    `¿Cómo va la tarde, ${NAME}?`,
    `Un respiro, ${NAME}`,
    `Poco a poco, ${NAME}`,
  ],
  evening: [
    `Buenas noches, ${NAME}`,
    `¿Qué tal ha ido el día, ${NAME}?`,
    `Hora de bajar el ritmo, ${NAME}`,
  ],
  night: [`Es tarde, ${NAME}. Descansa`, `Noche tranquila, ${NAME}`],
};

/** A few more for autumn, the season's own wink, mixed in with the rest. */
const AUTUMN: Record<Daypart, string[]> = {
  morning: [`Mañana fresca, ${NAME}`],
  afternoon: [`Tarde de otoño, ${NAME}`, `Tarde de manta y algo bueno, ${NAME}`],
  evening: [`Noche de otoño, ${NAME}`],
  night: [],
};

/**
 * The greeting for right now. Picked by date and part of day, not at random:
 * it stays the same each time you come back to the home that afternoon, and
 * changes tomorrow.
 */
export function greeting(d = new Date()): string {
  const part = daypart(d);
  const list =
    season(d) === "autumn" ? [...PHRASES[part], ...AUTUMN[part]] : PHRASES[part];
  const seed = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
  return list[seed % list.length];
}
