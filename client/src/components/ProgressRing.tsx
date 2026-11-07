import { CategoryIcon } from "./CategoryIcon";

/**
 * A category's mark: its icon inside a ring that fills with the progress
 * through the current level, in its colour. It replaces the card-with-a-bar:
 * the same information in one compact, recognisable shape, and the one
 * element that travels between the home and the category's screen.
 */
export function ProgressRing({
  slug,
  progress,
  size,
  stroke = 3,
  style,
}: {
  slug: string;
  /** 0..1 */
  progress: number;
  size: number;
  stroke?: number;
  style?: React.CSSProperties;
}) {
  const r = (size - stroke) / 2;
  const length = 2 * Math.PI * r;

  return (
    <span
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size, ...style }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="color-mix(in oklab, var(--accent) 12%, var(--color-paper))"
          stroke="color-mix(in oklab, var(--accent) 20%, var(--color-paper))"
          strokeWidth={stroke}
        />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - Math.max(0.02, progress))}
        />
      </svg>
      <CategoryIcon
        slug={slug}
        strokeWidth={1.8}
        className="relative text-(--accent)"
        style={{ width: size * 0.42, height: size * 0.42 }}
      />
    </span>
  );
}
