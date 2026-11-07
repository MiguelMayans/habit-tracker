/**
 * Shared error state for the screens that load data on mount, with a retry:
 * a network blip should not force a full reload just to try again.
 */
export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="card settle px-5 py-6 text-center">
      <p className="m-0 text-[17px] font-semibold">No se ha podido cargar</p>
      <p className="mt-2 mb-0 text-[14px] leading-relaxed text-ink-soft">
        {message}
      </p>
      <button type="button" onClick={onRetry} className="btn btn-soft mt-5">
        Reintentar
      </button>
    </div>
  );
}
