import { Link, useLocation } from "react-router-dom";

/**
 * Acción persistente en todas las pantallas (docs/DESIGN.md). Se oculta en la
 * propia pantalla de registro, donde ya no lleva a ningún sitio.
 *
 * Arrastra el contexto: si estás dentro de una categoría, el registro llega
 * con esa categoría ya elegida en vez de obligarte a repetirla.
 */
export function FabRegistrar() {
  const { pathname } = useLocation();
  if (pathname === "/log-activity") return null;

  const enCategoria = pathname.match(/^\/categories\/(\d+)$/);
  const destino = enCategoria
    ? `/log-activity?categoria=${enCategoria[1]}`
    : "/log-activity";

  return (
    <Link
      to={destino}
      className="corte-pildora anim-fab fixed right-4 bottom-6 z-40 inline-flex h-12 items-center gap-2.5 bg-amarillo pr-5 pl-4 font-display text-[12.5px] text-negro uppercase"
      style={{ transform: "skewX(-10deg)" }}
    >
      <span className="inline-block text-[21px] leading-none" style={{ transform: "skewX(10deg)" }}>
        +
      </span>
      <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
        Registrar
      </span>
    </Link>
  );
}
