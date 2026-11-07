/**
 * When a refresh fails but the screen already has data (from the last time,
 * see `peek` in api/client.ts), the data stays and this quiet line says why
 * it may be out of date. Replacing everything with an error panel threw away
 * exactly what you could still use, offline above all.
 */
export function StaleNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <p className="settle mt-0 mb-5 flex items-center gap-3 rounded-2xl bg-warn/8 px-4 py-2.5 text-[13px] text-warn">
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onRetry} className="shrink-0 font-semibold underline underline-offset-4">
        Reintentar
      </button>
    </p>
  );
}
