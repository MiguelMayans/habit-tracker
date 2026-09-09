import type { RecentActivity } from "../api/client";
import { claveDia } from "../lib/fecha";
import { XP_POR_INTENSIDAD } from "../lib/intensity";

const DIAS = 30;

/**
 * Cuánto tiñe un día según la XP que hiciste en él. Los cortes salen de lo
 * que cuestan las intensidades (10 / 20 / 35): por debajo de 20 es un gesto
 * suelto, 70 o más es un día de varias cosas.
 *
 * El vacío no es negro sino hueso muy tenue: un hueco tiene que verse como
 * un día que existió y no diste, no como un agujero en la tira.
 */
function tono(xp: number): string {
  if (xp === 0) return "rgb(245 245 240 / 0.12)";
  if (xp < 20) return "rgb(255 229 0 / 0.34)";
  if (xp < 40) return "rgb(255 229 0 / 0.58)";
  if (xp < 70) return "rgb(255 229 0 / 0.8)";
  return "var(--color-amarillo)";
}

/**
 * Los últimos 30 días, un cuadro por día, más encendido cuanta más XP.
 *
 * La cuenta se hace aquí y no en el servidor por lo mismo que la racha: a qué
 * día natural pertenece un timestamp depende de la zona horaria, que el
 * navegador conoce y el servidor no.
 */
export function TiraDeRitmo({
  actividades,
  racha,
}: {
  actividades: RecentActivity[];
  racha: number;
}) {
  const xpPorDia = new Map<string, number>();
  for (const a of actividades) {
    const clave = claveDia(new Date(a.date));
    xpPorDia.set(clave, (xpPorDia.get(clave) ?? 0) + XP_POR_INTENSIDAD[a.intensity]);
  }

  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (DIAS - 1));

  const dias = Array.from({ length: DIAS }, (_, i) => {
    const fecha = new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
    return {
      xp: xpPorDia.get(claveDia(fecha)) ?? 0,
      fecha,
      esHoy: i === DIAS - 1,
    };
  });

  return (
    <div
      className="anim-fila mb-9"
      style={{ "--retardo": "0.12s" } as React.CSSProperties}
    >
      <div className="mb-2 flex items-baseline gap-2 px-1">
        <span className="text-[9px] font-bold tracking-[0.2em] text-hueso/40">
          ÚLTIMOS 30 DÍAS
        </span>
        {racha > 0 && (
          // La racha vivía en su propia cinta arriba, al lado de la fecha.
          // Baja aquí porque habla exactamente de esta tira: tenerlas
          // separadas era decir dos veces lo mismo en dos idiomas visuales.
          <span className="ml-auto text-[9px] font-bold tracking-[0.16em] text-amarillo">
            RACHA · {racha} {racha === 1 ? "DÍA" : "DÍAS"}
          </span>
        )}
      </div>

      <ul className="flex gap-[3px]">
        {dias.map((d) => (
          <li
            key={d.fecha.toISOString()}
            title={`${d.fecha.getDate()}/${d.fecha.getMonth() + 1} · ${d.xp} XP`}
            className="aspect-square flex-1"
            style={{
              background: tono(d.xp),
              // Hoy va marcado aunque todavía esté vacío: es el día que
              // puedes cambiar, y sin la marca se pierde entre los huecos.
              boxShadow: d.esHoy
                ? "inset 0 0 0 1.5px var(--color-hueso)"
                : undefined,
            }}
          />
        ))}
      </ul>
    </div>
  );
}
