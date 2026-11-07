export type Season = "spring" | "summer" | "autumn" | "winter";

/** The season by the northern-hemisphere calendar (equinoxes and solstices). */
export function season(d = new Date()): Season {
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  if (md >= 321 && md < 621) return "spring";
  if (md >= 621 && md < 923) return "summer";
  if (md >= 923 && md < 1221) return "autumn";
  return "winter";
}
