import { useRef } from "react";

/**
 * Pulsación mantenida, del estilo "mantener para borrar" de las apps nativas.
 * No hace falta que la app sea nativa: con eventos de puntero se consigue lo
 * mismo. Lo que tiene truco es cancelarla bien, y son cuatro cosas:
 *
 * 1. Si el dedo se desplaza, es un scroll y no una pulsación: se cancela.
 * 2. Al soltar tras una pulsación larga el navegador dispara igualmente el
 *    click; si el elemento es un enlace, navegaría. Hay que tragárselo.
 * 3. En Android mantener pulsado abre el menú contextual del sistema encima.
 * 4. Mantener pulsado sobre texto lo selecciona y saca la lupa (ver la clase
 *    `pulsable-larga` en index.css).
 *
 * Usa eventos de puntero, así que vale igual para dedo, ratón y lápiz.
 */
export function usePulsacionLarga(alMantener: () => void, ms = 500) {
  const temporizador = useRef<number | null>(null);
  const origen = useRef<{ x: number; y: number } | null>(null);
  const disparada = useRef(false);

  function cancelar() {
    if (temporizador.current !== null) {
      window.clearTimeout(temporizador.current);
      temporizador.current = null;
    }
    origen.current = null;
  }

  return {
    onPointerDown(e: React.PointerEvent) {
      disparada.current = false;
      origen.current = { x: e.clientX, y: e.clientY };
      temporizador.current = window.setTimeout(() => {
        disparada.current = true;
        cancelar();
        alMantener();
      }, ms);
    },

    onPointerMove(e: React.PointerEvent) {
      if (!origen.current) return;
      const dx = Math.abs(e.clientX - origen.current.x);
      const dy = Math.abs(e.clientY - origen.current.y);
      if (dx > 10 || dy > 10) cancelar();
    },

    onPointerUp: cancelar,
    onPointerCancel: cancelar,
    onPointerLeave: cancelar,

    onClick(e: React.MouseEvent) {
      if (!disparada.current) return;
      e.preventDefault();
      e.stopPropagation();
      disparada.current = false;
    },

    onContextMenu(e: React.MouseEvent) {
      e.preventDefault();
    },
  };
}
