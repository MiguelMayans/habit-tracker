/** Días naturales transcurridos, ignorando la hora. */
function diasNaturales(desde: Date, hasta: Date): number {
  const a = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const b = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
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
