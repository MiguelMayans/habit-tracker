import { useState } from "react";
import { Link } from "react-router-dom";
import { getFocusesByCategory, type Category, type Focus } from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { desdeUltimaActividad } from "../lib/fecha";
import { CategoryIcon } from "./CategoryIcon";
import { logotipoDeCategoria } from "../lib/logotipoCategoria";

/** Giro y desvío alternos de cada tarjeta, para el efecto collage. */
const GIROS = ["-1.2deg", "0.8deg", "-0.6deg", "1.1deg", "-0.9deg"];
const DESVIOS = ["0px", "10px", "0px", "12px", "0px"];

/**
 * Una categoría en la home, con sus focos desplegables dentro.
 *
 * El enlace al detalle NO envuelve la tarjeta entera, como sí hacía antes: la
 * barra de desplegar es un botón y un botón dentro de un enlace no es HTML
 * válido — el navegador lo desanida y el resultado depende de cada uno. Así
 * que el enlace cubre la franja del título y los datos, y la barra y el panel
 * de focos son hermanos suyos dentro del mismo recorte de la tarjeta.
 *
 * El precio: el nivel y el logotipo, que van superpuestos fuera del recorte,
 * dejan de ser zona de enlace. Se toca la tarjeta, no el número.
 */
export function TarjetaCategoria({
  category: c,
  indice: i,
}: {
  category: Category;
  indice: number;
}) {
  const [abierto, setAbierto] = useState(false);
  const [focos, setFocos] = useState<Focus[] | null>(null);
  const [cargandoFocos, setCargandoFocos] = useState(false);
  const [errorFocos, setErrorFocos] = useState<string | null>(null);

  const acento = categoryColorVar(c.slug);
  const ultima = desdeUltimaActividad(c.lastActivityAt);
  const logotipo = logotipoDeCategoria(c.slug);
  const idPanel = `focos-categoria-${c.id}`;

  function cargarFocos() {
    setCargandoFocos(true);
    setErrorFocos(null);
    getFocusesByCategory(c.id)
      .then(setFocos)
      .catch((e: Error) => setErrorFocos(e.message))
      .finally(() => setCargandoFocos(false));
  }

  // Los focos se piden al abrir por primera vez, no al cargar la home: son
  // cinco categorías y lo normal es desplegar una, no las cinco.
  function onAlternar() {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (siguiente && focos === null && !cargandoFocos) cargarFocos();
  }

  return (
    <li
      className="tarjeta-categoria anim-tarjeta relative"
      style={
        {
          "--rotacion": GIROS[i % GIROS.length],
          "--retardo": `${0.16 + i * 0.07}s`,
          marginLeft: DESVIOS[i % DESVIOS.length],
        } as React.CSSProperties
      }
    >
      {/* El nivel vive FUERA de la capa recortada; por eso puede salirse por
          arriba de la tarjeta.

          `pointer-events-none` porque, al estar por delante, se tragaba los
          toques en el trozo de franja que tapa y creaba una zona muerta. No se
          convierte en enlace como sí hace el logotipo: es un dato, y dos
          enlaces al mismo sitio dentro de la misma tarjeta ya son los justos. */}
      <span className="contenido-slam pointer-events-none absolute -top-4 right-4 z-20 flex items-baseline gap-1.5">
        <span className="texto-contorno text-[9px] font-bold tracking-[0.24em] text-hueso">
          NIVEL
        </span>
        {/* El nivel es la recompensa, así que va en amarillo de sistema con la
            rotulación del logotipo. */}
        <b className="texto-rotulo font-display text-[46px] leading-[0.82] text-amarillo">
          {c.level}
        </b>
      </span>

      {logotipo && (
        // Fuera de la capa recortada, igual que el nivel: así se sale por
        // arriba de la franja sin que la tarjeta lo corte ni empuje la altura
        // de la franja. Y va desplazado a la izquierda para que, al crecer, el
        // extremo derecho apenas se mueva y no se meta debajo del nivel.
        //
        // Lleva enlace propio, hermano del de la tarjeta y no anidado en él:
        // al ir por delante se tragaba los toques, y el nombre de la categoría
        // —que es lo que más pide que lo pulses— no llevaba a ninguna parte.
        // Además es el único sitio donde ese nombre existe como texto, porque
        // con logotipo la franja no lo escribe: sin este enlace, el de la
        // tarjeta se anuncia solo con sus cifras.
        <h2 className="contenido-slam absolute -top-7 left-0 z-20 m-0">
          <Link to={`/categories/${c.id}`} className="block">
            <img
              src={logotipo.src}
              alt={c.name}
              width={logotipo.ancho}
              height={logotipo.alto}
              className="h-[98px] w-auto max-w-none"
            />
          </Link>
        </h2>
      )}

      <div
        className="tarjeta-recorte bg-negro"
        style={{
          // La sombra dura va en el color de la categoría: sobre fondo negro
          // una sombra negra no se vería, y así suma color a la composición.
          filter: `drop-shadow(11px 11px 0 ${acento})`,
        }}
      >
        <Link to={`/categories/${c.id}`} className="block">
          {/* Franja de color. Reserva sitio a la derecha para el nivel, que va
              superpuesto y fuera de esta capa. Altura fija: así la franja mide
              lo mismo en las cinco categorías, lleven logotipo o texto. */}
          <div
            className="relative h-[50px] pr-24 pl-3.5"
            style={{ background: acento }}
          >
            {/* Con logotipo no va además el icono: la imagen ya trae su propio
                símbolo dibujado. */}
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
          <div className="relative px-3.5 pt-3 pb-2">
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
                      <b className="text-amarillo">{c.xpToNextLevel}</b> AL NV{" "}
                      {c.level + 1}
                    </>
                  )}
                </span>
                <i className="h-[3px] w-[3px] rotate-45 bg-hueso/55" />
                <span className={ultima.frio ? "text-cuerpo" : undefined}>
                  {ultima.texto}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Ni franja propia ni fondo distinto: la primera versión apilaba tres
            rectángulos oscuros —barra, panel y una caja por foco— y la tarjeta
            se volvía un mazacote. Aquí el mando es una línea más de la misma
            micro-tipografía que los datos de arriba, y lo único que dice que
            se puede tocar es el triángulo en el color de la categoría. */}
        {c.focusCount === 0 ? (
          // Una categoría sin focos ocuparía esta línea con una etiqueta
          // muerta. En su sitio, el atajo a lo único que se puede hacer ahí.
          <Link to={`/categories/${c.id}`} className="block px-3.5 pb-3">
            <span className="contenido-slam block text-[9.5px] font-bold tracking-[0.16em] text-hueso/30">
              SIN FOCOS ·{" "}
              <span style={{ color: acento }}>AÑADIR EL PRIMERO</span>
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAlternar}
            aria-expanded={abierto}
            aria-controls={idPanel}
            className="block w-full px-3.5 pb-3 text-left"
          >
            <span className="contenido-slam flex items-center gap-1.5 text-[9.5px] font-bold tracking-[0.16em] text-hueso/40">
              <span
                className="inline-block text-[8px] leading-none"
                style={{
                  color: acento,
                  transform: abierto ? "rotate(90deg)" : undefined,
                }}
              >
                ▶
              </span>
              {c.focusCount} {c.focusCount === 1 ? "FOCO" : "FOCOS"}
            </span>
          </button>
        )}

        {abierto && (
          <div id={idPanel} className="px-3.5 pb-3.5">
            <div className="contenido-slam">
              {cargandoFocos && (
                <div className="grid gap-2.5" aria-label="Cargando focos">
                  <div className="esqueleto h-3 w-2/3" />
                  <div className="esqueleto h-3 w-1/2" />
                </div>
              )}

              {errorFocos && (
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="m-0 text-[10px] font-bold text-cuerpo">
                    {errorFocos}
                  </p>
                  <button
                    type="button"
                    onClick={cargarFocos}
                    className="text-[9.5px] font-bold tracking-[0.14em] text-hueso/60 underline"
                  >
                    REINTENTAR
                  </button>
                </div>
              )}

              {focos && !cargandoFocos && !errorFocos && (
                // Un solo filete en el color de la categoría para toda la
                // lista, en vez de un borde por foco: agrupa igual y mete un
                // trazo donde antes había cinco.
                <ul
                  className="grid gap-3 border-l-2 pl-3"
                  style={{ borderColor: acento }}
                >
                  {focos.map((f, j) => (
                    <FilaFocoHome
                      key={f.id}
                      focus={f}
                      categoryId={c.id}
                      acento={acento}
                      esHijo={f.parentFocusId !== null}
                      retardo={j * 0.04}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Un foco dentro del desplegable. Tocarlo registra actividad en él
 * directamente, que es lo que hace que desplegar valga la pena: un toque en
 * lugar de tres.
 *
 * Un foco congelado no se enlaza: está en el nivel máximo y el backend
 * rechazaría la actividad. Engendrar su hijo se sigue haciendo desde el
 * detalle de la categoría, que es donde vive el formulario.
 */
function FilaFocoHome({
  focus: f,
  categoryId,
  acento,
  esHijo,
  retardo,
}: {
  focus: Focus;
  categoryId: number;
  acento: string;
  esHijo: boolean;
  retardo: number;
}) {
  const contenido = (
    <>
      <div className="flex items-baseline gap-2">
        {esHijo && (
          <span className="shrink-0 text-[9px] leading-none text-hueso/30">↳</span>
        )}
        <span className="truncate font-display text-[13px] leading-none text-hueso uppercase">
          {f.name}
        </span>
        {/* Un foco congelado no acepta actividad, así que en vez del nivel
            se dice por qué: maestría si llegó al tope, cerrado si lo diste
            por terminado a mano. */}
        <span
          className={`ml-auto shrink-0 text-[9px] font-bold tracking-[0.14em] ${
            f.atMaxLevel
              ? "text-amarillo"
              : f.frozen
                ? "text-hueso/35"
                : "text-hueso/45"
          }`}
        >
          {f.atMaxLevel ? "MAESTRÍA" : f.frozen ? "CERRADO" : `NV ${f.level}`}
        </span>
      </div>

      {/* Un filete de 2px en vez de la barra de 6: aquí el progreso se ojea,
          no se consulta. El detalle de la categoría sigue teniéndola entera. */}
      <div className="mt-1.5 h-[2px] bg-hueso/12">
        <div
          className="h-full"
          style={{
            width: `${Math.round(f.progress * 100)}%`,
            background: f.frozen ? acento : "var(--color-amarillo)",
          }}
        />
      </div>
    </>
  );

  return (
    <li
      className={`anim-fila ${esHijo ? "pl-3" : ""}`}
      style={{ "--retardo": `${retardo}s` } as React.CSSProperties}
    >
      {f.frozen ? (
        <div>{contenido}</div>
      ) : (
        <Link
          to={`/log-activity?categoria=${categoryId}&foco=${f.id}`}
          className="block"
        >
          {contenido}
        </Link>
      )}
    </li>
  );
}
