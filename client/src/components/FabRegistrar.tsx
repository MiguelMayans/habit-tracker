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
    // Sin ancho fijo: la pastilla la mide el rótulo. Con un ancho a mano
    // habría que recalcularlo a ojo cada vez que cambie el texto o el cuerpo.
    <Link
      to={destino}
      className="anim-fab fixed right-5 bottom-6 z-40 flex h-12 items-center justify-center px-7"
      style={{ transform: "skewX(-10deg)" }}
    >
      {/* El recorte vive en esta capa y no en el enlace porque `clip-path`
          recorta también la `box-shadow`, y ahí es donde late el botón. */}
      <div className="corte-pildora absolute inset-0 bg-amarillo" />

      {/* Contra-inclinado: la pastilla va torcida, el rótulo se lee recto. */}
      <span
        className="relative flex items-baseline gap-1.5 font-display text-[14px] leading-none text-negro uppercase"
        style={{ transform: "skewX(10deg)" }}
      >
        <b className="text-[18px] leading-none">+</b>
        Registrar
      </span>
    </Link>
  );
}
