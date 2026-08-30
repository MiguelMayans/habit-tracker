import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, type Category } from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { desdeUltimaActividad, fechaLarga } from "../lib/fecha";
import { CategoryIcon } from "../components/CategoryIcon";

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
      <header className="relative mb-11 px-1">
        <div
          className="bloque-roto anim-bloque absolute -left-6 top-3 -z-10 h-23 w-72 bg-cuerpo"
          style={{ transform: "rotate(-3.5deg)" }}
        />
        <h1
          className="anim-titulo m-0 font-display text-[52px] leading-[0.94] text-hueso"
          style={{
            transform: "rotate(-3deg) skewX(-10deg)",
            transformOrigin: "left center",
            textShadow: "4px 4px 0 var(--color-negro)",
          }}
        >
          Mike's Life
        </h1>
        <p
          className="anim-cinta mt-5 inline-block bg-amarillo px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-negro"
          style={{ transform: "skewX(-10deg)" }}
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
                  <b className="texto-golpe font-display text-[46px] leading-[0.82] text-hueso">
                    {c.level}
                  </b>
                </span>

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
                  <div
                    className="relative py-3 pr-24 pl-3.5"
                    style={{ background: acento }}
                  >
                    <h2 className="contenido-slam texto-golpe m-0 font-display text-[22px] leading-none text-hueso uppercase">
                      {c.name}
                    </h2>
                  </div>

                  {/* Zona negra: los datos se leen mejor y vuelve el amarillo. */}
                  <div className="relative px-3.5 pt-3 pb-3.5">
                    {/* Cabe entero dentro de la zona negra: a 112px se salía
                        y varios iconos quedaban cortados. */}
                    <CategoryIcon
                      slug={c.slug}
                      className="marca-fondo pointer-events-none absolute right-3 bottom-2 h-14 w-14 opacity-25"
                      style={{ color: acento }}
                    />

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
