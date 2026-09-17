/**
 * Shared error state for the screens that load data on mount. It carries a
 * retry button: a network blip should not force a full page reload just to
 * try again.
 */
export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="anim-slam bg-black px-4 py-4"
      style={{ boxShadow: "6px 6px 0 var(--color-cuerpo)" }}
    >
      <p className="m-0 font-display text-[16px] leading-tight text-bone uppercase">
        Algo ha fallado
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-bone/70">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="slam-button mt-4 w-full"
        style={{ background: "var(--color-cuerpo)", color: "var(--color-bone)" }}
      >
        <span>Reintentar</span>
      </button>
    </div>
  );
}
