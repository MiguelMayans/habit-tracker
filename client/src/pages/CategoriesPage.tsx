import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCategories,
  getRecentActivities,
  type Category,
  type RecentActivity,
} from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { calcularRacha, desdeUltimaActividad, esDeHoy, fechaLarga } from "../lib/fecha";
import { XP_POR_INTENSIDAD } from "../lib/intensity";
import { CategoryIcon } from "../components/CategoryIcon";
import { logotipoDeCategoria } from "../lib/logotipoCategoria";
import { TarjetasEsqueleto } from "../components/TarjetasEsqueleto";
import { PanelError } from "../components/PanelError";
import logo from "../assets/logo.png";

/** Giro y desvío alternos de cada tarjeta, para el efecto collage. */
const GIROS = ["-1.2deg", "0.8deg", "-0.6deg", "1.1deg", "-0.9deg"];
const DESVIOS = ["0px", "10px", "0px", "12px", "0px"];

// Suficiente para una racha de meses y para encontrar los últimos focos
// usados sin necesitar una segunda llamada (bloque de focos recientes).
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

  // Los últimos 5 focos DISTINTOS usados, en orden de uso más reciente:
  // registrar en uno concreto pasa de tres toques a uno. Uno congelado no
  // admite actividad, así que no se ofrece aunque sea el más reciente.
  const focosRecientes: {
    focusId: number;
    focusName: string;
    categoryId: number;
    categorySlug: string;
  }[] = [];
  {
    const vistos = new Set<number>();
    for (const a of recientes) {
      if (a.focusId === null || a.focusFrozen || vistos.has(a.focusId)) continue;
      vistos.add(a.focusId);
      focosRecientes.push({
        focusId: a.focusId,
        focusName: a.focusName ?? "Foco",
        categoryId: a.categoryId,
        categorySlug: a.categorySlug,
      });
      if (focosRecientes.length >= 5) break;
    }
  }

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

      {focosRecientes.length > 0 && (
        <div className="anim-fila mb-9" style={{ "--retardo": "0.1s" } as React.CSSProperties}>
          <p className="mb-2.5 px-1 text-[9px] font-bold tracking-[0.2em] text-hueso/40">
            ÚLTIMOS FOCOS
          </p>
          {/* Full-bleed lateral, como la banda: así el scroll llega hasta el
              borde de la pantalla en vez de pararse en el padding del layout. */}
          <ul className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
            {focosRecientes.map((f) => {
              const acento = categoryColorVar(f.categorySlug);
              return (
                <li key={f.focusId} className="shrink-0">
                  <Link
                    to={`/log-activity?categoria=${f.categoryId}&foco=${f.focusId}`}
                    className="block bg-[#111] px-3 py-2"
                    style={{ borderLeft: `4px solid ${acento}`, minWidth: "132px" }}
                  >
                    <span
                      className="block text-[8px] font-bold tracking-[0.16em]"
                      style={{ color: acento }}
                    >
                      {categories.find((c) => c.slug === f.categorySlug)?.name.toUpperCase() ??
                        f.categorySlug.toUpperCase()}
                    </span>
                    <span className="mt-0.5 block truncate font-display text-[14px] leading-tight text-hueso">
                      {f.focusName}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Hueco algo mayor de lo normal: el nivel sobresale por arriba. */}
      <ul className="grid gap-6">
        {categories.map((c, i) => {
          const acento = categoryColorVar(c.slug);
          const ultima = desdeUltimaActividad(c.lastActivityAt);
          const logotipo = logotipoDeCategoria(c.slug);

          return (
            <li
              key={c.id}
              className="tarjeta-categoria anim-tarjeta relative"
              style={
                {
                  "--rotacion": GIROS[i % GIROS.length],
                  "--retardo": `${0.16 + i * 0.07}s`,
                  marginLeft: DESVIOS[i % DESVIOS.length],
                } as React.CSSProperties
              }
            >
              <Link to={`/categories/${c.id}`} className="block">
                {/* El nivel vive FUERA de la capa recortada; por eso puede
                    salirse por arriba de la tarjeta. */}
                <span className="contenido-slam absolute -top-4 right-4 z-20 flex items-baseline gap-1.5">
                  <span className="texto-contorno text-[9px] font-bold tracking-[0.24em] text-hueso">
                    NIVEL
                  </span>
                  {/* El nivel es la recompensa, así que va en amarillo de
                      sistema con la rotulación del logotipo. */}
                  <b className="texto-rotulo font-display text-[46px] leading-[0.82] text-amarillo">
                    {c.level}
                  </b>
                </span>

                {logotipo && (
                  // Fuera de la capa recortada, igual que el nivel: así se
                  // sale por arriba de la franja sin que la tarjeta lo corte
                  // ni empuje la altura de la franja. Y va desplazado a la
                  // izquierda para que, al crecer, el extremo derecho apenas
                  // se mueva y no se meta debajo del nivel.
                  <h2 className="contenido-slam absolute -top-7 left-0 z-20 m-0">
                    <img
                      src={logotipo.src}
                      alt={c.name}
                      width={logotipo.ancho}
                      height={logotipo.alto}
                      className="h-[98px] w-auto max-w-none"
                    />
                  </h2>
                )}

                <div
                  className="tarjeta-recorte bg-negro"
                  style={{
                    // La sombra dura va en el color de la categoría: sobre
                    // fondo negro una sombra negra no se vería, y así suma
                    // color a la composición.
                    filter: `drop-shadow(11px 11px 0 ${acento})`,
                  }}
                >
                  {/* Franja de color. Reserva sitio a la derecha para el
                      nivel, que va superpuesto y fuera de esta capa. */}
                  {/* Altura fija: así la franja mide lo mismo en las cinco
                      categorías, lleven logotipo o texto. */}
                  <div
                    className="relative h-[50px] pr-24 pl-3.5"
                    style={{ background: acento }}
                  >
                    {/* Con logotipo no va además el icono: la imagen ya trae
                        su propio símbolo dibujado. */}
                    {!logotipo && (
                      <div className="contenido-slam flex h-full items-center gap-2.5">
                        <CategoryIcon
                          slug={c.slug}
                          strokeWidth={2.4}
                          className="h-[26px] w-[26px] shrink-0 text-negro"
                        />
                        <h2 className="texto-rotulo-fino m-0 font-display text-[22px] leading-none text-hueso uppercase">
                          {c.name}
                        </h2>
                      </div>
                    )}
                  </div>

                  {/* Zona negra: los datos se leen mejor y vuelve el amarillo. */}
                  <div className="relative px-3.5 pt-3 pb-3.5">
                    <div className="contenido-slam relative z-10">
                      <div className="barra-xp relative h-4 overflow-hidden bg-[#242424]">
                        <div
                          className="barra-xp-relleno relative h-full bg-amarillo"
                          style={
                            {
                              width: `${Math.round(c.progress * 100)}%`,
                              "--retardo": `${0.38 + i * 0.07}s`,
                            } as React.CSSProperties
                          }
                        />
                      </div>

                      <div className="mt-2.5 flex items-center gap-2 text-[10px] font-semibold tracking-[0.06em] text-hueso/75">
                        <span>{c.currentXp} XP</span>
                        <i className="h-[3px] w-[3px] rotate-45 bg-hueso/55" />
                        <span>
                          {c.atMaxLevel ? (
                            <b className="text-amarillo">NIVEL MÁXIMO</b>
                          ) : (
                            <>
                              <b className="text-amarillo">{c.xpToNextLevel}</b>{" "}
                              AL NV {c.level + 1}
                            </>
                          )}
                        </span>
                        <i className="h-[3px] w-[3px] rotate-45 bg-hueso/55" />
                        <span>
                          {c.focusCount} {c.focusCount === 1 ? "FOCO" : "FOCOS"}
                        </span>
                        <i className="h-[3px] w-[3px] rotate-45 bg-hueso/55" />
                        <span
                          className={ultima.frio ? "text-cuerpo" : undefined}
                        >
                          {ultima.texto}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
