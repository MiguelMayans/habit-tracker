/**
 * A rating as five small dots. Read-only without `onChange`; with it, each
 * dot is a button, and tapping the one already set clears the rating —
 * not rating something is a valid answer.
 */
export function Rating({
  value,
  onChange,
  size = 8,
}: {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: number;
}) {
  const v = value ?? 0;
  const style = { "--gem": `${size}px` } as React.CSSProperties;

  if (!onChange) {
    return (
      <span className="rating" style={style} aria-label={`${v} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <i key={n} data-on={n <= v} />
        ))}
      </span>
    );
  }

  return (
    <span className="rating" style={style} role="radiogroup" aria-label="Nota">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === v}
          aria-label={`${n} de 5`}
          onClick={() => onChange(n === v ? null : n)}
        >
          <i data-on={n <= v} />
        </button>
      ))}
    </span>
  );
}
