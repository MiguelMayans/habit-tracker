import { useEffect, useState } from "react";
import { UPDATE_EVENT, updateNow } from "../lib/pwa";

/**
 * "NUEVA VERSIÓN · ACTUALIZAR": shown when a deploy has been downloaded and
 * is waiting (see lib/pwa.ts). A tape across the top, the way Persona slides
 * its notices in. Dismissing it just hides it: the new version keeps
 * waiting, and the banner comes back the next time the app is opened.
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
      className="update-banner fixed top-3 right-3 left-3 z-[65] mx-auto max-w-md"
      role="status"
    >
      <div className="update-banner-tape flex items-center gap-3 bg-yellow py-2 pr-2 pl-4">
        <span className="update-banner-content flex-1 font-display text-[13px] leading-tight text-black uppercase">
          Nueva versión
        </span>
        <button
          type="button"
          onClick={() => {
            setUpdating(true);
            updateNow();
          }}
          disabled={updating}
          className="update-banner-content shrink-0 bg-black px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-yellow"
        >
          {updating ? "ACTUALIZANDO…" : "ACTUALIZAR"}
        </button>
        <button
          type="button"
          onClick={() => setReady(false)}
          aria-label="Ahora no"
          className="update-banner-content shrink-0 px-1.5 font-display text-[16px] leading-none text-black"
        >
          ×
        </button>
      </div>
    </div>
  );
}
