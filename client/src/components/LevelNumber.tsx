/**
 * A level, said quietly: "Nivel 3", the word soft and the figure in ink. The
 * big version (a category's own level) is `.level-big` in index.css.
 */
export function LevelNumber({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <span className={`text-[13px] whitespace-nowrap text-ink-soft ${className}`}>
      Nivel <b className="font-semibold text-ink">{value}</b>
    </span>
  );
}
