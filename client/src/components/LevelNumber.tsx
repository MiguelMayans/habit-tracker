/**
 * A level, spelled in ransom-note cut-outs: every digit on its own scrap of
 * paper, with its own face, colour and tilt.
 *
 * It is the lettering of the Phantom Thieves' calling cards, and it is the
 * same language the category wordmarks already speak — their letters are cut
 * out too. A level set in the display face was one more yellow number; cut
 * out, it reads as a trophy someone pasted on.
 *
 * Everything is derived from the digit and its position, never random, so a
 * given number always looks the same: 19 is always the same two scraps. When
 * two neighbours would come out identical, the second one moves on to the next
 * style, so no number is ever two copies of the same scrap.
 *
 * Typography, not images: a sheet of drawn digits was tried once and rejected.
 */

type Scrap = {
  paper: string;
  ink: string;
  /** The scissor edge: a hairline of the opposite value around the paper. */
  edge: string;
  font: string;
  /** Each face has a different cap height; this evens them out. */
  scale: number;
  clip: string;
};

const SCRAPS: Scrap[] = [
  {
    paper: "var(--color-yellow)",
    ink: "var(--color-black)",
    edge: "var(--color-black)",
    font: "var(--font-display)",
    scale: 0.8,
    clip: "polygon(3% 7%, 97% 0, 100% 93%, 0 100%)",
  },
  {
    paper: "var(--color-black)",
    ink: "var(--color-yellow)",
    edge: "var(--color-bone)",
    font: '"Abril Fatface", serif',
    scale: 1,
    clip: "polygon(0 0, 100% 6%, 95% 100%, 4% 94%)",
  },
  {
    paper: "var(--color-bone)",
    ink: "var(--color-black)",
    edge: "var(--color-black)",
    font: '"Anton", var(--font-display)',
    scale: 1.02,
    clip: "polygon(7% 0, 100% 4%, 96% 97%, 0 91%)",
  },
  {
    paper: "var(--color-yellow)",
    ink: "var(--color-black)",
    edge: "var(--color-black)",
    font: '"Abril Fatface", serif',
    scale: 1,
    clip: "polygon(0 5%, 92% 0, 100% 100%, 5% 95%)",
  },
];

/** Tilt in degrees and vertical offset in em, per digit + position. */
const TILTS = [-11, 8, -5, 12, -8, 6, 13, -7, 4, -10];
const LIFTS = [-0.09, 0.07, 0.01, -0.11, 0.1, -0.04, 0.06, -0.08, 0.09, -0.02];

function scrapsFor(value: number) {
  const digits = String(value).split("");
  let previous = -1;

  return digits.map((d, i) => {
    const n = Number(d);
    let style = (n + i * 3) % SCRAPS.length;
    if (style === previous) style = (style + 1) % SCRAPS.length;
    previous = style;

    return {
      digit: d,
      scrap: SCRAPS[style],
      tilt: TILTS[(n + i * 4) % TILTS.length],
      lift: LIFTS[(n * 3 + i) % LIFTS.length],
    };
  });
}

export function LevelNumber({
  value,
  size,
  slam = false,
  className = "",
}: {
  value: number;
  /** Font size in px of an average scrap. */
  size: number;
  /** Pastes the scraps on one after another, for a level-up. */
  slam?: boolean;
  className?: string;
}) {
  return (
    <b
      className={`ransom ${className}`}
      style={{ fontSize: size }}
      aria-label={String(value)}
      role="img"
    >
      {scrapsFor(value).map((s, i) => (
        <span
          key={`${i}-${s.digit}`}
          aria-hidden="true"
          className={`ransom-scrap ${slam ? "anim-scrap" : ""}`}
          style={
            {
              "--edge": s.scrap.edge,
              "--paper": s.scrap.paper,
              "--clip": s.scrap.clip,
              "--tilt": `${s.tilt}deg`,
              "--lift": `${s.lift}em`,
              "--i": i,
            } as React.CSSProperties
          }
        >
          <span
            style={{
              color: s.scrap.ink,
              fontFamily: s.scrap.font,
              fontSize: `${s.scrap.scale}em`,
            }}
          >
            {s.digit}
          </span>
        </span>
      ))}
    </b>
  );
}
