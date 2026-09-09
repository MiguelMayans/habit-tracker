import { useCallback, useEffect, useState } from "react";
import {
  getCategories,
  getRecentActivities,
  type Category,
  type RecentActivity,
} from "../api/client";
import { calcularRacha, esDeHoy, fechaLarga } from "../lib/fecha";
import { XP_POR_INTENSIDAD } from "../lib/intensity";
import { TarjetaCategoria } from "../components/TarjetaCategoria";
import { TarjetasEsqueleto } from "../components/TarjetasEsqueleto";
import { PanelError } from "../components/PanelError";
import logo from "../assets/logo.png";

// Suficiente para una racha de meses: la racha se corta en cuanto falta un
// día, así que traer más solo serviría para rachas irrealmente largas.
const RECIENTES_LIMITE = 300;

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recientes, setRecientes] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    Promise.all([
      getCategories(),
      getRecentActivities({ limit: RECIENTES_LIMITE }),
    ])
      .then(([cats, acts]) => {
        setCategories(cats);
        setRecientes(acts);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // El reset de loading/error vive en el evento que lo provoca (el botón),
  // no dentro del efecto: así una llamada síncrona a setState no dispara un
  // segundo render en cascada mientras React sincroniza el efecto.
  function onReintentar() {
    setLoading(true);
    setError(null);
    cargar();
  }

  const racha = calcularRacha(recientes.map((a) => a.date));
  const deHoy = recientes.filter((a) => esDeHoy(a.date));
  const xpDeHoy = deHoy.reduce((sum, a) => sum + XP_POR_INTENSIDAD[a.intensity], 0);

  if (loading)
    return (
      <div className="px-4 pt-8 pb-32">
        <TarjetasEsqueleto n={5} />
      </div>
    );
  if (error)
    return (
      <div className="px-4 pt-8 pb-32">
        <PanelError mensaje={error} onReintentar={onReintentar} />
      </div>
    );

  return (
    <div className="px-4 pt-8 pb-32">
      <header className="relative mb-10 px-1">
        {/* El logotipo sustituye al título tipográfico. Ancho fluido con tope,
            para que en móvil ocupe el ancho disponible y no crezca de más en
            pantallas grandes. width/height evitan el salto de maquetación
            mientras carga. */}
        {/* La banda va suelta en la cabecera, no dentro del h1: tiene que
            desbordar el ancho del contenedor para llegar a los dos bordes. */}
        <div className="banda-sangre anim-logo top-[-16px] z-0 h-[128px]" />

        <h1 className="relative z-10 m-0 w-full max-w-[340px]">
          <img
            src={logo}
            alt="Mike's Life"
            width={800}
            height={325}
            className="anim-logo block h-auto w-full"
          />
        </h1>
        {/* relative + z-10: los papeles del logo van posicionados y, sin esto,
            se pintan por encima de la cinta y la tapan. */}
        <p
          className="anim-cinta relative z-10 mt-4 inline-block bg-amarillo px-4 py-1.5 text-[12px] font-bold tracking-[0.18em] text-negro"
          style={{
            transform: "rotate(-2.5deg) skewX(-10deg)",
            boxShadow: "4px 4px 0 var(--color-negro)",
          }}
        >
          <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
            {fechaLarga(new Date())}
          </span>
        </p>

        {(racha > 0 || deHoy.length > 0) && (
          <div className="anim-cinta relative z-10 mt-2.5 flex flex-wrap gap-2">
            {racha > 0 && (
              <span
                className="inline-block bg-hueso px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-negro"
                style={{
                  transform: "rotate(1.5deg) skewX(-10deg)",
                  boxShadow: "3px 3px 0 var(--color-negro)",
                }}
              >
                <span
                  className="inline-block"
                  style={{ transform: "skewX(10deg)" }}
                >
                  RACHA · {racha} {racha === 1 ? "DÍA" : "DÍAS"}
                </span>
              </span>
            )}
            {deHoy.length > 0 && (
              <span
                className="inline-block bg-amarillo px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-negro"
                style={{
                  transform: "rotate(-1.5deg) skewX(-10deg)",
                  boxShadow: "3px 3px 0 var(--color-negro)",
                }}
              >
                <span
                  className="inline-block"
                  style={{ transform: "skewX(10deg)" }}
                >
                  HOY · {deHoy.length} · +{xpDeHoy} XP
                </span>
              </span>
            )}
          </div>
        )}
      </header>

      {/* Hueco algo mayor de lo normal: el nivel sobresale por arriba. */}
      <ul className="grid gap-6">
        {categories.map((c, i) => (
          <TarjetaCategoria key={c.id} category={c} indice={i} />
        ))}
      </ul>
    </div>
  );
}
