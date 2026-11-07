import { useEffect, useState } from "react";
import { UPDATE_EVENT, updateNow } from "../lib/pwa";

/**
 * Shown when a new version has been downloaded and is waiting (see
 * lib/pwa.ts): a small note at the top. Dismissing it just hides it; the new
 * version keeps waiting and the note comes back the next time the app opens.
 */
export function UpdateBanner() {
  const [ready, setReady] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const show = () => setReady(true);
    window.addEventListener(UPDATE_EVENT, show);
    return () => window.removeEventListener(UPDATE_EVENT, show);
  }, []);

  if (!ready) return null;

  return (
    <div
      className="sheet-in fixed top-3 right-4 left-4 z-[65] mx-auto flex max-w-md items-center gap-3 rounded-full border border-line bg-paper py-1.5 pr-1.5 pl-5 shadow-[0_6px_24px_rgb(46_42_37/0.08)]"
      role="status"
    >
      <span className="flex-1 text-[14px] font-medium">Hay una versión nueva</span>
      <button
        type="button"
        onClick={() => setReady(false)}
        className="link-quiet px-2"
      >
        Luego
      </button>
      <button
        type="button"
        onClick={() => {
          setUpdating(true);
          updateNow();
        }}
        disabled={updating}
        className="btn min-h-9 px-4 text-[14px]"
      >
        {updating ? "Actualizando…" : "Actualizar"}
      </button>
    </div>
  );
}
