import { useState } from "react";
import { Link } from "react-router-dom";
import { getFocusesByCategory, type Category, type Focus } from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { desdeUltimaActividad } from "../lib/fecha";
import { CategoryIcon } from "./CategoryIcon";
import { NivelNumero } from "./NivelNumero";
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
          arriba de la tarjeta. Aquí va sin el rótulo NIVEL que sí lleva el
          detalle: la ráfaga ya canta bastante, y dos cifras más la etiqueta no
          caben en el hueco que la franja reserva a la derecha. */}
      <span className="contenido-slam absolute -top-8 right-3 z-20 block">
        <NivelNumero valor={c.level} alto={68} />
      </span>

      {logotipo && (
        // Fuera de la capa recortada, igual que el nivel: así se sale por
        // arriba de la franja sin que la tarjeta lo corte ni empuje la altura
        // de la franja. Y va desplazado a la izquierda para que, al crecer, el
        // extremo derecho apenas se mueva y no se meta debajo del nivel.
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
            className="relative h-[50px] pr-28 pl-3.5"
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
          <div className="relative px-3.5 pt-3 pb-3">
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

        {/* Una categoría sin focos ocuparía este hueco con una etiqueta muerta.
            En su sitio, el atajo a lo único que se puede hacer ahí. */}
        {c.focusCount === 0 ? (
          <Link
            to={`/categories/${c.id}`}
            className="block border-t border-hueso/10 bg-[#141414] px-3.5 py-2"
          >
            <span className="contenido-slam flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.16em] text-hueso/40">
                SIN FOCOS TODAVÍA
              </span>
              <span
                className="ml-auto text-[10px] font-bold tracking-[0.14em]"
                style={{ color: acento }}
              >
                AÑADIR ↴
              </span>
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAlternar}
            aria-expanded={abierto}
            aria-controls={idPanel}
            className="block w-full border-t border-hueso/10 bg-[#141414] px-3.5 py-2 text-left"
          >
            <span className="contenido-slam flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.16em] text-hueso/55">
                {c.focusCount} {c.focusCount === 1 ? "FOCO" : "FOCOS"}
              </span>
              <span
                className="ml-auto text-[11px] leading-none"
                style={{
                  color: acento,
                  display: "inline-block",
                  transform: abierto ? "rotate(180deg)" : undefined,
                }}
              >
                ▼
              </span>
            </span>
          </button>
        )}

        {abierto && (
          <div
            id={idPanel}
            className="border-t border-hueso/10 bg-[#0b0b0b] px-3.5 py-3"
          >
            <div className="contenido-slam">
              {cargandoFocos && (
                <div className="esqueleto h-9 w-full" aria-label="Cargando focos" />
              )}

              {errorFocos && (
                <div className="flex items-center gap-2">
                  <p className="m-0 text-[10px] font-bold text-cuerpo">
                    {errorFocos}
                  </p>
                  <button
                    type="button"
                    onClick={cargarFocos}
                    className="text-[10px] font-bold tracking-[0.14em] text-hueso/60 underline"
                  >
                    REINTENTAR
                  </button>
                </div>
              )}

              {focos && !cargandoFocos && !errorFocos && (
                <ul className="grid gap-2">
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
        {esHijo && <span className="text-[10px] text-hueso/35">↳</span>}
        <span className="truncate font-display text-[14px] leading-none text-hueso uppercase">
          {f.name}
        </span>
        {f.frozen && (
          <span
            className="shrink-0 bg-amarillo px-1.5 py-0.5 text-[7.5px] font-bold tracking-[0.16em] text-negro"
            style={{ transform: "skewX(-10deg)" }}
          >
            MAESTRÍA
          </span>
        )}
        <span className="ml-auto shrink-0 text-[9px] font-bold tracking-[0.14em] text-hueso/60">
          NV{" "}
          <b className="font-display text-[13px] tracking-normal text-hueso">
            {f.level}
          </b>
        </span>
      </div>

      <div className="barra-xp mt-1.5 h-[6px] overflow-hidden bg-[#242424]">
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

  const clases = `block bg-[#141414] py-2 pr-2.5 pl-2.5 ${f.frozen ? "opacity-65" : ""}`;
  const estilo = { borderLeft: `3px solid ${acento}` };

  return (
    <li
      className={`anim-fila ${esHijo ? "ml-4" : ""}`}
      style={{ "--retardo": `${retardo}s` } as React.CSSProperties}
    >
      {f.frozen ? (
        <div className={clases} style={estilo}>
          {contenido}
        </div>
      ) : (
        <Link
          to={`/log-activity?categoria=${categoryId}&foco=${f.id}`}
          className={clases}
          style={estilo}
        >
          {contenido}
        </Link>
      )}
    </li>
  );
}
