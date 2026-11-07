/**
 * A soft burst of dots in the five category colours, drifting out and
 * fading: a celebration you notice, not one that shouts. A fixed ring rather
 * than random, so it looks composed instead of noisy. Place it inside a
 * positioned element; it bursts from that element's top centre.
 */
export function Confetti({ delay = 0 }: { delay?: number }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.2;
        const reach = 70 + ((i * 37) % 60);
        return (
          <i
            key={i}
            style={
              {
                "--x": `${Math.round(Math.cos(angle) * reach)}px`,
                "--y": `${Math.round(Math.sin(angle) * reach * 0.7 + 30)}px`,
                "--s": `${6 + ((i * 5) % 6)}px`,
                "--c": `var(--color-${["cuerpo", "mente", "corazon", "disciplina", "ingenio"][i % 5]})`,
                "--d": `${delay + (i % 4) * 0.03}s`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
