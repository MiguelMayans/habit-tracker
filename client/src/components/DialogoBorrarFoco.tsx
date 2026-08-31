import { useEffect, useRef } from "react";
import type { Focus } from "../api/client";

/**
 * Confirmación de borrado. No usa `confirm()` del navegador: rompería el tono
 * de la app y en PWA instalada se ve como un cuadro ajeno al sistema.
 *
 * Dice explícitamente qué pasa con las actividades, porque es la duda real:
 * no se borran, y la XP que dieron se queda en la categoría.
 */
export function DialogoBorrarFoco({
  foco,
  actividades,
  borrando,
  error,
  onConfirmar,
  onCancelar,
}: {
  foco: Focus;
  actividades: number;
  borrando: boolean;
  error: string | null;
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
      aria-labelledby="titulo-borrar-foco"
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
            id="titulo-borrar-foco"
            className="texto-contorno m-0 font-display text-[16px] text-hueso uppercase"
          >
            ¿Borrar foco?
          </h2>
        </div>

        <div className="px-4 py-4">
          <p className="m-0 font-display text-[20px] leading-tight text-hueso uppercase">
            {foco.name}
          </p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.14em] text-hueso/55">
            NIVEL {foco.level} · {foco.currentXp} XP
          </p>

          <p className="mt-4 text-[11.5px] leading-relaxed text-hueso/75">
            {actividades === 0 ? (
              <>No tiene actividades registradas.</>
            ) : (
              <>
                Sus <b className="text-amarillo">{actividades}</b>{" "}
                {actividades === 1 ? "actividad" : "actividades"} no se{" "}
                {actividades === 1 ? "borra" : "borran"}: se{" "}
                {actividades === 1 ? "queda" : "quedan"} en la categoría sin
                foco. La XP que{" "}
                {actividades === 1 ? "te dio sigue" : "te dieron siguen"}{" "}
                contando.
              </>
            )}
          </p>

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
              disabled={borrando}
              className="boton-slam flex-1"
              style={{
                background: "var(--color-cuerpo)",
                color: "var(--color-hueso)",
              }}
            >
              <span>{borrando ? "Borrando…" : "Borrar"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
