import { useEffect, useState } from "react";
import { onToast, TOAST_MS, type Toast } from "../lib/toast";

/** The one toast on screen: a new one replaces it. See lib/toast.ts. */
export function Toaster() {
  // The key restarts the timer and the entrance when a toast replaces another.
  const [current, setCurrent] = useState<{ toast: Toast; key: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      onToast((toast) => {
        setError(null);
        setCurrent((c) => ({ toast, key: (c?.key ?? 0) + 1 }));
      }),
    [],
  );

  useEffect(() => {
    if (!current || busy) return;
    const t = window.setTimeout(() => setCurrent(null), error ? TOAST_MS * 2 : TOAST_MS);
    return () => window.clearTimeout(t);
  }, [current, busy, error]);

  if (!current) return null;
  const { toast, key } = current;

  async function run() {
    if (!toast.action) return;
    setError(null);
    setBusy(true);
    try {
      await toast.action.run();
      setCurrent(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div key={key} className="toast" role="status">
      <span className="min-w-0 flex-1">{error ?? toast.message}</span>
      {toast.action && !error && (
        <button type="button" onClick={run} disabled={busy} className="toast-action">
          {busy ? "…" : toast.action.label}
        </button>
      )}
    </div>
  );
}
