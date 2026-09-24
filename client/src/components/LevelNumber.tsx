/**
 * A level: the figure in the same lettering as the day on the home's calendar
 * — bone, black outline — but extruded into a solid block, with an "NV" tape
 * pinned to its corner in place of a loose "NIVEL" label.
 *
 * Tried and dropped along the way: ransom-note scraps (read worse than a plain
 * figure) and a spiky burst behind the number (too much).
 */
export function LevelNumber({
  value,
  size,
  slam = false,
  tag = true,
  className = "",
}: {
  value: number;
  /** Font size in px of the figure. */
  size: number;
  /** Slams the figure into place, for a level-up. */
  slam?: boolean;
  /** The "NV" tape. Off where it would be too small to read. */
  tag?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`level-badge ${className}`}
      style={{ fontSize: size }}
      role="img"
      aria-label={`Nivel ${value}`}
    >
      <b
        className={`level-figure ${slam ? "anim-level-drop" : ""}`}
        aria-hidden="true"
      >
        {value}
      </b>

      {tag && (
        <span className="level-tag" aria-hidden="true">
          <span>NV</span>
        </span>
      )}
    </span>
  );
}
