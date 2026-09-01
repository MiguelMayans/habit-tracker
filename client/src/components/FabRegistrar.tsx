import { Link, useLocation } from "react-router-dom";
import registrar from "../assets/wordmarks/registrar.png";

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
      className="anim-fab fixed right-5 bottom-6 z-40 block h-12 w-[124px]"
      style={{ transform: "skewX(-10deg)" }}
    >
      {/* La pastilla mantiene su alto de siempre; el rótulo la desborda por
          los cuatro lados. Por eso el recorte vive en esta capa y la imagen
          es hermana suya: dentro, el clip-path se la comería. */}
      <div className="corte-pildora absolute inset-0 bg-amarillo" />

      {/* El rótulo trae dentro su propia cruz, así que el botón ya no pone el
          "+" aparte. Se contra-inclina para que el dibujo se vea recto y sea
          la pastilla la que va torcida, como en el resto de la app. */}
      <img
        src={registrar}
        alt="Registrar"
        width={420}
        height={175}
        className="absolute top-1/2 left-1/2 block h-[62px] w-auto max-w-none"
        style={{ transform: "translate(-50%, -50%) skewX(10deg)" }}
      />
    </Link>
  );
}
