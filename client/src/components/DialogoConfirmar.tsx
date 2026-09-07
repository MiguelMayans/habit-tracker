import { useEffect, useRef, type ReactNode } from "react";

/**
 * Confirmación genérica para una acción destructiva o irreversible. No usa
 * `confirm()` del navegador: rompería el tono de la app y en PWA instalada se
 * ve como un cuadro ajeno al sistema.
 *
 * El cuerpo (qué se va a hacer y sus consecuencias) lo decide cada llamada:
 * este componente solo pone el armazón — franja de título, foco inicial en
 * Cancelar, cierre con Escape y los dos botones.
 */
export function DialogoConfirmar({
  tituloFranja,
  idTitulo,
  children,
  procesando,
  error,
  textoConfirmar,
  textoProcesando,
  onConfirmar,
  onCancelar,
}: {
  tituloFranja: string;
  idTitulo: string;
  children: ReactNode;
  procesando: boolean;
  error: string | null;
  textoConfirmar: string;
  textoProcesando: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const cancelar = useRef<HTMLButtonElement>(null);

  // Escape cierra, y el foco arranca en Cancelar: la acción destructiva no
  // debe ser la que se dispara al pulsar Enter sin mirar.
  useEffect(() => {
    cancelar.current?.focus();

    function onTecla(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", onTecla);
    return () => window.removeEventListener("keydown", onTecla);
  }, [onCancelar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitulo}
    >
      <button
        type="button"
        aria-label="Cancelar"
        onClick={onCancelar}
        className="absolute inset-0 bg-negro/80"
      />

      <div
        className="anim-slam relative w-full max-w-sm bg-negro"
        style={{ boxShadow: "9px 9px 0 var(--color-cuerpo)" }}
      >
        <div className="bg-cuerpo px-4 py-2.5">
          <h2
            id={idTitulo}
            className="texto-contorno m-0 font-display text-[16px] text-hueso uppercase"
          >
            {tituloFranja}
          </h2>
        </div>

        <div className="px-4 py-4">
          {children}

          {error && (
            <p className="anim-slam mt-4 bg-cuerpo px-3 py-2 text-[11px] font-bold text-hueso">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              ref={cancelar}
              type="button"
              onClick={onCancelar}
              className="boton-slam flex-1"
              style={{ background: "var(--color-hueso)" }}
            >
              <span>Cancelar</span>
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={procesando}
              className="boton-slam flex-1"
              style={{
                background: "var(--color-cuerpo)",
                color: "var(--color-hueso)",
              }}
            >
              <span>{procesando ? textoProcesando : textoConfirmar}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
