import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, type Category } from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { desdeUltimaActividad, fechaLarga } from "../lib/fecha";
import { CategoryIcon } from "../components/CategoryIcon";
import { logotipoDeCategoria } from "../lib/logotipoCategoria";
import logo from "../assets/logo.png";

/** Giro y desvío alternos de cada tarjeta, para el efecto collage. */
const GIROS = ["-1.2deg", "0.8deg", "-0.6deg", "1.1deg", "-0.9deg"];
const DESVIOS = ["0px", "10px", "0px", "12px", "0px"];

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p className="px-6 py-10 text-hueso/60">Cargando categorías…</p>;
  if (error) return <p className="px-6 py-10 text-cuerpo">Error: {error}</p>;

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
      </header>

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
