import { useState } from "react";
import { getCategories } from "../api/client";
import { setApiKey } from "../lib/apiKey";
import logo from "../assets/logo.png";

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
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto px-5 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-title"
    >
      <div className="absolute inset-0 bg-black/85" />

      <form
        onSubmit={onSubmit}
        className="anim-slam relative w-full max-w-sm"
      >
        <img
          src={logo}
          alt="Mike's Life"
          width={800}
          height={325}
          className="mx-auto mb-6 block h-auto w-full max-w-[280px]"
        />

        <div
          className="bg-black px-4 pt-4 pb-5"
          style={{ boxShadow: "9px 9px 0 var(--color-yellow)" }}
        >
          <h1
            id="unlock-title"
            className="field-label m-0 mb-3 inline-block"
          >
            <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
              CLAVE DE ACCESO
            </span>
          </h1>
          <p className="m-0 mb-4 text-[11.5px] leading-relaxed text-bone/75">
            Este dispositivo todavía no la tiene. Se pide una sola vez.
          </p>

          <div className="field-frame">
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              autoComplete="current-password"
              aria-label="Clave de acceso"
              className="field"
            />
          </div>

          {error && (
            <p className="anim-slam mt-4 mb-0 bg-cuerpo px-3 py-2 text-[11px] font-bold text-bone">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={checking || value.trim() === ""}
            className="slam-button mt-5 w-full"
          >
            <span>{checking ? "Comprobando…" : "Entrar"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
