/** How long a toast stays, ms: long enough to read and reach for Deshacer. */
export const TOAST_MS = 5000;

export type Toast = {
  message: string;
  /** Usually "Deshacer". Throws on failure: the toaster shows the error. */
  action?: { label: string; run: () => Promise<void> };
};

const EVENT = "app-toast";

/**
 * A quiet line above the bottom bar: what just happened, and the way to take
 * it back. Logging is two taps, so a slip is two taps away too — and it should
 * not take a trip to the history and a long press to fix it.
 */
export function showToast(toast: Toast) {
  window.dispatchEvent(new CustomEvent<Toast>(EVENT, { detail: toast }));
}

export function onToast(listener: (toast: Toast) => void): () => void {
  const handler = (e: Event) => listener((e as CustomEvent<Toast>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
