/**
 * Estado de carga compartido por las pantallas que listan tarjetas o filas:
 * la home, el detalle de categoría y el historial. Bloques que laten en vez
 * de un "Cargando…" gris que se sale del lenguaje visual de la app.
 */
export function TarjetasEsqueleto({
  n = 5,
  altura = "132px",
}: {
  n?: number;
  altura?: string;
}) {
  return (
    <ul className="grid gap-4" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <li key={i} className="esqueleto" style={{ height: altura }} />
      ))}
    </ul>
  );
}
