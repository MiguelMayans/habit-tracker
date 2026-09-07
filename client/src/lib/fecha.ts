/** Días naturales transcurridos, ignorando la hora. */
function diasNaturales(desde: Date, hasta: Date): number {
  const a = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const b = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Si `iso` cae en el día natural de hoy. Sirve para decidir si se ofrece
 * DESHACER: el servidor tiene la última palabra (docs/DESIGN.md, excepción
 * de deshacer), esto solo evita mostrar el botón cuando ya se sabe que va a
 * fallar.
 */
export function esDeHoy(iso: string): boolean {
  return diasNaturales(new Date(iso), new Date()) <= 0;
}

/** Clave de día natural, para meter fechas en un Set sin duplicados de hora. */
function claveDia(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Días consecutivos con alguna actividad, terminando hoy o ayer. Si hoy
 * todavía no hay ninguna, el día no ha terminado — no cuenta como hueco, y el
 * conteo arranca en ayer. Solo se rompe al saltarse un día entero.
 *
 * No hace falta al servidor: son fechas que ya tiene el cliente delante, y la
 * cuenta depende de la zona horaria del usuario, que el navegador ya conoce y
 * el servidor no.
 */
export function calcularRacha(fechasIso: string[]): number {
  if (fechasIso.length === 0) return 0;

  const dias = new Set(fechasIso.map((iso) => claveDia(new Date(iso))));

  const cursor = new Date();
  if (!dias.has(claveDia(cursor))) cursor.setDate(cursor.getDate() - 1);

  let racha = 0;
  while (dias.has(claveDia(cursor))) {
    racha += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return racha;
}

/**
 * Señal de inactividad de docs/DESIGN.md: informativa, nunca punitiva. Solo
 * dice cuándo fue la última vez, sin regañar ni restar nada.
 */
export function desdeUltimaActividad(iso: string | null): {
  texto: string;
  frio: boolean;
} {
  if (!iso) return { texto: "SIN ACTIVIDAD", frio: false };

  const dias = diasNaturales(new Date(iso), new Date());

  if (dias <= 0) return { texto: "HOY", frio: false };
  if (dias === 1) return { texto: "AYER", frio: false };

  // A partir de una semana se marca en rojo: sigue siendo un dato, no un aviso.
  return { texto: `HACE ${dias} DÍAS`, frio: dias >= 7 };
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function fechaLarga(d: Date): string {
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/**
 * Para listas: lo reciente se dice en relativo, que es como lo recuerdas, y a
 * partir de una semana se pasa a fecha, que es cuando "hace 23 días" deja de
 * significar nada.
 */
export function fechaRelativaCorta(iso: string): string {
  const d = new Date(iso);
  const dias = diasNaturales(d, new Date());

  if (dias <= 0) return "HOY";
  if (dias === 1) return "AYER";
  if (dias < 7) return `HACE ${dias} DÍAS`;

  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3).toUpperCase()}`;
}
