/**
 * A level, said quietly: "Nivel 3", the word soft and the figure in ink. In
 * its large form the figure stands on its own, light and big, with the word
 * as a small caption above it.
 */
export function LevelNumber({
  value,
  size = "sm",
  className = "",
}: {
  value: number;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (size === "lg") {
    return (
      <span className={`inline-grid justify-items-end ${className}`}>
        <span className="text-[12px] font-medium text-ink-soft">Nivel</span>
        <b className="text-[34px] leading-none font-semibold">{value}</b>
      </span>
    );
  }

  return (
    <span className={`text-[13px] whitespace-nowrap text-ink-soft ${className}`}>
      Nivel <b className="font-semibold text-ink">{value}</b>
    </span>
  );
}
