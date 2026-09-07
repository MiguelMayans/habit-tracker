/**
 * Estado de error compartido por las pantallas que cargan datos al montar.
 * Con botón de reintentar: un error de red no debería obligar a recargar
 * toda la página para volver a intentarlo.
 */
export function PanelError({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar: () => void;
}) {
  return (
    <div
      className="anim-slam bg-negro px-4 py-4"
      style={{ boxShadow: "6px 6px 0 var(--color-cuerpo)" }}
    >
      <p className="m-0 font-display text-[16px] leading-tight text-hueso uppercase">
        Algo ha fallado
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-hueso/70">{mensaje}</p>
      <button
        type="button"
        onClick={onReintentar}
        className="boton-slam mt-4 w-full"
        style={{ background: "var(--color-cuerpo)", color: "var(--color-hueso)" }}
      >
        <span>Reintentar</span>
      </button>
    </div>
  );
}
