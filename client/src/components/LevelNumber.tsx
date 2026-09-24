/**
 * A level, as a rank badge: the figure in the same lettering as the day on
 * the home's calendar — bone, thick black outline — but extruded into a solid
 * block, and slapped on a spiky burst with an "NV" tape pinned to its corner.
 * It is the Confidant rank card of Persona, and it echoes the burst behind the
 * whole app.
 *
 * The burst grows spikes as you level up: a level 2 is a modest pop, a level
 * 40 bristles all the way round. The figure says the number; the silhouette
 * says, at a glance and without reading, how far along you are.
 *
 * The shape is derived from the level, never random, so a given level always
 * wears the same burst. Its spikes are uneven for the same reason the rays
 * are: a regular star reads as clip-art, an irregular one as an explosion.
 */

/** Spikes on the burst: 7 at level 1, one more every 4 levels, capped at 22. */
function spikesFor(level: number): number {
  return Math.min(7 + Math.floor((level - 1) / 4), 22);
}

/** A stable pseudo-random 0..1 from two integers. */
function noise(a: number, b: number): number {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function burstPolygon(level: number): string {
  const n = spikesFor(level);
  const points: string[] = [];
  // A different starting angle per level, so neighbouring levels do not look
  // like the same star with one more point.
  const start = noise(level, 0) * Math.PI;

  for (let i = 0; i < n * 2; i++) {
    const angle = start + (i * Math.PI) / n;
    const outer = i % 2 === 0;
    const r = outer ? 44 + noise(level, i) * 6 : 25 + noise(level, i) * 5;
    points.push(
      `${(50 + r * Math.cos(angle)).toFixed(1)}% ${(50 + r * Math.sin(angle)).toFixed(1)}%`,
    );
  }

  return `polygon(${points.join(", ")})`;
}

export function LevelNumber({
  value,
  size,
  slam = false,
  tag = true,
  className = "",
}: {
  value: number;
  /** Font size in px of the figure; the badge grows around it. */
  size: number;
  /** Spins the burst in and slams the figure, for a level-up. */
  slam?: boolean;
  /** The "NV" tape. Off where a label already sits next to it. */
  tag?: boolean;
  className?: string;
}) {
  const clip = burstPolygon(value);

  return (
    <span
      className={`level-badge ${value >= 10 ? "level-badge-wide" : ""} ${className}`}
      style={{ fontSize: size }}
      role="img"
      aria-label={`Nivel ${value}`}
    >
      <span
        className={`level-burst ${slam ? "anim-burst-in" : ""}`}
        style={
          { "--sway-delay": `-${((value * 0.83) % 3.6).toFixed(2)}s` } as React.CSSProperties
        }
        aria-hidden="true"
      >
        <i style={{ clipPath: clip }} />
        <i style={{ clipPath: clip }} />
      </span>

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
