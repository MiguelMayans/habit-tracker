/**
 * Shared loading state for the screens that list cards or rows: the home, the
 * category detail and the history. Blocks that pulse, rather than a grey
 * "Cargando…" that falls outside the app's visual language.
 */
export function SkeletonCards({
  n = 5,
  height = "132px",
}: {
  n?: number;
  height?: string;
}) {
  return (
    <ul className="grid gap-4" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <li key={i} className="skeleton" style={{ height }} />
      ))}
    </ul>
  );
}
