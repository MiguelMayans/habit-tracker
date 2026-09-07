import type { Activity } from "../api/client";
import { esDeHoy, fechaRelativaCorta } from "../lib/fecha";
import { XP_POR_INTENSIDAD } from "../lib/intensity";
import { usePulsacionLarga } from "../lib/usePulsacionLarga";

/**
 * Fila del historial, compartida entre el detalle de categoría (los últimos
 * HISTORIAL_VISIBLE) y el historial completo. La pulsación mantenida solo se
 * activa si la actividad es de hoy: el servidor rechazaría deshacer una más
 * vieja, así que ni se ofrece el gesto — evita abrir un diálogo que solo
 * puede acabar en error.
 */
export function FilaActividad({
  actividad,
  acento,
  focusName,
  retardo,
  onMantener,
}: {
  actividad: Activity;
  acento: string;
  /** Nombre del foco, o `null` si la actividad no tenía uno. */
  focusName: string | null;
  retardo: number;
  onMantener: () => void;
}) {
  const puedeDeshacer = esDeHoy(actividad.date);
  const pulsacion = usePulsacionLarga(onMantener);

  return (
    <li
      className={`anim-fila relative bg-[#111] py-2.5 pr-3 pl-3.5 ${puedeDeshacer ? "pulsable-larga" : ""}`}
      style={
        {
          borderLeft: `5px solid ${acento}`,
          "--retardo": `${retardo}s`,
        } as React.CSSProperties
      }
      {...(puedeDeshacer ? pulsacion : undefined)}
    >
      <div className="flex items-baseline gap-3">
        <p
          className={`m-0 flex-1 text-[12px] leading-snug font-semibold ${
            actividad.description === "" ? "text-hueso/40 italic" : "text-hueso"
          }`}
        >
          {actividad.description === "" ? "Sin descripción" : actividad.description}
        </p>
        <span className="shrink-0 text-[9px] font-bold tracking-[0.14em] text-hueso/50">
          {fechaRelativaCorta(actividad.date)}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <span
          className="bg-amarillo px-1.5 py-0.5 font-display text-[10px] text-negro"
          style={{ transform: "skewX(-10deg)" }}
        >
          +{XP_POR_INTENSIDAD[actividad.intensity]} XP
        </span>
        {focusName !== null && (
          <span className="text-[9.5px] font-semibold tracking-[0.06em] text-hueso/55">
            ↳ {focusName}
          </span>
        )}
      </div>
    </li>
  );
}
