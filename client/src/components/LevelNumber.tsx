/**
 * A level, set exactly like the day on the home's calendar: bone display
 * type with a thick black outline and one hard shadow. Clear at a glance,
 * and the same object as the other big number on the home.
 *
 * Ransom-note scraps were tried here and dropped: they looked the part but
 * read worse than a plain, heavy figure.
 */
export function LevelNumber({
  value,
  size,
  slam = false,
  className = "",
}: {
  value: number;
  /** Font size in px. */
  size: number;
  /** Slams the number into place, for a level-up. */
  slam?: boolean;
  className?: string;
}) {
  // Below ~30px the full outline eats the counters of the digits, so small
  // levels take the finer variant of the same lettering.
  const sign = size >= 30 ? "text-sign" : "text-sign-fine";

  return (
    <b
      className={`${sign} inline-block font-display leading-[0.8] text-bone ${
        slam ? "anim-level-drop" : ""
      } ${className}`}
      style={{ fontSize: size }}
    >
      {value}
    </b>
  );
}
