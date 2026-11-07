import { useState } from "react";
import { getCategories } from "../api/client";
import { setApiKey } from "../lib/apiKey";

/**
 * Asked for once per device: the key the API requires (see the server's
 * requireApiKey). It appears whenever the server answers 401 — first open on
 * a new phone, or after the key changes.
 *
 * The key is tried before being trusted: it is stored, one real request is
 * made with it, and only if that succeeds does the app reload with every
 * screen fetching again. A wrong key stays on this screen and says so.
 */
export function UnlockScreen() {
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setChecking(true);
    setApiKey(value.trim());

    try {
      await getCategories();
      window.location.reload();
    } catch {
      setError("Esa clave no abre. Prueba otra vez.");
      setChecking(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-sand px-6 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-title"
    >
      <form onSubmit={onSubmit} className="settle w-full max-w-sm">
        <p className="eyebrow m-0">Mike&apos;s Life</p>
        <h1 id="unlock-title" className="display mt-2 mb-0 text-[34px]">
          Clave de acceso
        </h1>
        <p className="mt-2 mb-6 text-[15px] leading-relaxed text-ink-soft">
          Este dispositivo todavía no la tiene. Se pide una sola vez.
        </p>

        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          autoComplete="current-password"
          aria-label="Clave de acceso"
          className="field"
        />

        {error && (
          <p className="mt-3 mb-0 text-[14px] text-warn">{error}</p>
        )}

        <button
          type="submit"
          disabled={checking || value.trim() === ""}
          className="btn mt-6 w-full"
        >
          {checking ? "Comprobando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
