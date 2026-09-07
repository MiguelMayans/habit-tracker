import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createFocus,
  deleteActivity,
  deleteFocus,
  getActivitiesByCategory,
  getCategory,
  getFocusesByCategory,
  renameFocus,
  type Activity,
  type Category,
  type Focus,
} from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { CategoryIcon } from "../components/CategoryIcon";
import { logotipoDeCategoria } from "../lib/logotipoCategoria";
import { esDeHoy, fechaRelativaCorta } from "../lib/fecha";
import { XP_POR_INTENSIDAD } from "../lib/intensity";
import { usePulsacionLarga } from "../lib/usePulsacionLarga";
import { DialogoConfirmar } from "../components/DialogoConfirmar";
import { FilaActividad } from "../components/FilaActividad";
import { TarjetasEsqueleto } from "../components/TarjetasEsqueleto";
import { PanelError } from "../components/PanelError";

/** Cuántas actividades se listan antes de cortar. */
const HISTORIAL_VISIBLE = 8;

/** Giro alterno de las fichas de foco, para el efecto collage. */
const GIROS = ["-0.9deg", "0.7deg", "-0.5deg", "1deg", "-0.7deg"];

/**
 * Pulsar un foco lleva a registrar actividad EN ese foco, con categoría y
 * foco ya elegidos.
 *
 * Un foco congelado no se enlaza: está en el nivel máximo y el backend
 * rechazaría la actividad. En su lugar, un toque corto engendra su foco
 * hijo — el mismo gesto que en un foco activo lleva a registrar, aquí lleva
 * a la única acción que SÍ admite. La pulsación mantenida sigue borrando en
 * los dos casos.
 */
function FichaFoco({
  frozen,
  categoryId,
  focusId,
  onMantener,
  onEngendrar,
  children,
}: {
  frozen: boolean;
  categoryId: number;
  focusId: number;
  onMantener: () => void;
  onEngendrar: () => void;
  children: React.ReactNode;
}) {
  const pulsacion = usePulsacionLarga(onMantener);

  if (frozen) {
    return (
      <div
        className="pulsable-larga block"
        role="button"
        tabIndex={0}
        {...pulsacion}
        onClick={(e) => {
          // El propio hook ya traga el click cuando lo que disparó fue la
          // pulsación larga (marca preventDefault): si ha llegado hasta aquí
          // es que fue un toque corto de verdad.
          pulsacion.onClick(e);
          if (!e.defaultPrevented) onEngendrar();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onEngendrar();
          }
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <Link
      to={`/log-activity?categoria=${categoryId}&foco=${focusId}`}
      className="pulsable-larga block"
      {...pulsacion}
    >
      {children}
    </Link>
  );
}

export function CategoryDetailPage() {
  const { id } = useParams();
  const categoryId = Number(id);

  const [category, setCategory] = useState<Category | null>(null);
  const [focuses, setFocuses] = useState<Focus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Del formulario de creación, separado del error de carga para que un fallo
  // al crear no borre de la pantalla lo que ya se había cargado bien.
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [creando, setCreando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  // El foco recién creado se marca un momento en la lista: aparecer al final
  // del scroll no se distingue de que no haya pasado nada.
  const [focoNuevo, setFocoNuevo] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Al tocar un foco congelado se fija aquí como padre; el formulario de abajo
  // pasa a crear su hijo en vez de un foco suelto.
  const [padreEngendrar, setPadreEngendrar] = useState<Focus | null>(null);
  const formularioRef = useRef<HTMLFormElement>(null);
  const inputNombreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!padreEngendrar) return;
    formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Se retrasa a que el scroll suave termine: si el foco de teclado llega
    // antes, el navegador salta directo a la posición final y se pierde la
    // animación.
    const t = window.setTimeout(() => inputNombreRef.current?.focus(), 350);
    return () => window.clearTimeout(t);
  }, [padreEngendrar]);

  // Borrado por pulsación mantenida.
  const [focoABorrar, setFocoABorrar] = useState<Focus | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);

  // Deshacer un registro por pulsación mantenida sobre su fila del historial.
  const [actividadADeshacer, setActividadADeshacer] = useState<Activity | null>(
    null,
  );
  const [deshaciendo, setDeshaciendo] = useState(false);
  const [errorDeshacer, setErrorDeshacer] = useState<string | null>(null);

  const cargarFocuses = useCallback(async () => {
    setFocuses(await getFocusesByCategory(categoryId));
  }, [categoryId]);

  // Renombrar: la única salida ante una errata era borrar el foco, que
  // además desengancha sus actividades. Desproporcionado para una palabra
  // mal escrita.
  const [focoEditando, setFocoEditando] = useState<Focus | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [renombrando, setRenombrando] = useState(false);
  const [errorRenombrar, setErrorRenombrar] = useState<string | null>(null);

  async function onGuardarRenombrado() {
    if (!focoEditando) return;
    setErrorRenombrar(null);
    setRenombrando(true);

    try {
      await renameFocus(focoEditando.id, nombreEditado);
      setFocoEditando(null);
      await cargarFocuses();
    } catch (err) {
      setErrorRenombrar((err as Error).message);
    } finally {
      setRenombrando(false);
    }
  }

  // Se deriva en render, no en un efecto: no depende de nada externo.
  const idValido = Number.isInteger(categoryId);

  // Se envuelve en useCallback para poder llamarla también desde el botón de
  // reintentar, sin duplicar el fetch.
  const cargar = useCallback(() => {
    if (!idValido) return () => {};

    // Si se navega a otra categoría antes de que llegue esta respuesta, se
    // descarta: si no, una respuesta lenta podría pisar a una más reciente.
    let cancelado = false;

    Promise.all([
      getCategory(categoryId),
      getFocusesByCategory(categoryId),
      getActivitiesByCategory(categoryId),
    ])
      .then(([cat, focs, acts]) => {
        if (cancelado) return;
        setCategory(cat);
        setFocuses(focs);
        setActivities(acts);
      })
      .catch((e: Error) => {
        if (!cancelado) setError(e.message);
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [categoryId, idValido]);

  useEffect(() => cargar(), [cargar]);

  // El reset de loading/error vive en el evento que lo provoca (el botón),
  // no dentro del efecto.
  function onReintentar() {
    setLoading(true);
    setError(null);
    cargar();
  }

  async function onCrearFocus(e: React.FormEvent) {
    e.preventDefault();
    setErrorForm(null);
    setCreando(true);

    try {
      const creado = await createFocus({
        categoryId,
        name: nombreNuevo,
        parentFocusId: padreEngendrar?.id,
      });
      setNombreNuevo("");
      setPadreEngendrar(null);
      // Refresca solo la lista, sin recargar la página.
      await cargarFocuses();
      setFocoNuevo(creado.id);
    } catch (err) {
      setErrorForm((err as Error).message);
    } finally {
      setCreando(false);
    }
  }

  async function onBorrarFoco() {
    if (!focoABorrar) return;
    setErrorBorrado(null);
    setBorrando(true);

    try {
      await deleteFocus(focoABorrar.id);
      setFocoABorrar(null);
      // Las actividades siguen ahí, pero ya sin foco: se recargan las dos
      // listas para que el historial deje de atribuirlas.
      const [focs, acts] = await Promise.all([
        getFocusesByCategory(categoryId),
        getActivitiesByCategory(categoryId),
      ]);
      setFocuses(focs);
      setActivities(acts);
    } catch (err) {
      setErrorBorrado((err as Error).message);
    } finally {
      setBorrando(false);
    }
  }

  async function onDeshacerActividad() {
    if (!actividadADeshacer) return;
    setErrorDeshacer(null);
    setDeshaciendo(true);

    try {
      await deleteActivity(actividadADeshacer.id);
      setActividadADeshacer(null);
      // La XP revertida pudo cambiar la categoría y el foco: se recargan las
      // tres listas para que nada se quede con un número desactualizado.
      const [cat, focs, acts] = await Promise.all([
        getCategory(categoryId),
        getFocusesByCategory(categoryId),
        getActivitiesByCategory(categoryId),
      ]);
      setCategory(cat);
      setFocuses(focs);
      setActivities(acts);
    } catch (err) {
      setErrorDeshacer((err as Error).message);
    } finally {
      setDeshaciendo(false);
    }
  }

  if (!idValido)
    return (
      <p className="px-6 py-10 text-cuerpo">El id de la categoría no es válido</p>
    );
  if (loading)
    return (
      <div className="px-4 pt-8 pb-32">
        <TarjetasEsqueleto n={3} altura="96px" />
      </div>
    );
  if (error)
    return (
      <div className="px-4 pt-8 pb-32">
        <PanelError mensaje={error} onReintentar={onReintentar} />
      </div>
    );
  if (!category) return null;

  const acento = categoryColorVar(category.slug);
  const logotipo = logotipoDeCategoria(category.slug);

  return (
    <div className="px-4 pt-6 pb-32">
      <Link
        to="/"
        className="anim-fila inline-block bg-hueso px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-negro"
        style={{ transform: "skewX(-10deg)" }}
      >
        <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
          ← CATEGORÍAS
        </span>
      </Link>

      {/* Cabecera: misma banda a sangre que la home, pero en el color de la
          categoría, para que se note en cuál estás. */}
      <header className="relative mt-6 mb-9">
        {/* El nivel va en su propia línea y no al lado del título: así el
            logotipo se queda con todo el ancho y puede ir a lo grande, que es
            lo que pide una portada de categoría. */}
        <span className="relative z-20 mb-1 flex items-baseline justify-end gap-1.5">
          <span className="texto-contorno text-[9px] font-bold tracking-[0.24em] text-hueso">
            NIVEL
          </span>
          <b className="texto-rotulo font-display text-[46px] leading-[0.82] text-amarillo">
            {category.level}
          </b>
        </span>

        <div className="relative">
          {/* La banda se centra sobre el título con top + margen negativo (la
              mitad de su alto): no puede usar translate porque el giro ya
              ocupa la transformación. Así vale igual para un logotipo alto
              que para uno bajo. */}
          <div
            className="banda-sangre anim-logo top-1/2 -mt-14 z-0 h-[112px]"
            style={
              {
                "--banda-fondo": acento,
                "--banda-reborde": "var(--color-negro)",
              } as React.CSSProperties
            }
          />

          {logotipo ? (
            <h1 className="relative z-10 m-0">
              {/* A ancho completo: el logotipo manda en la pantalla y se sale
                  de la banda por arriba y por abajo, como en la home. */}
              <img
                src={logotipo.src}
                alt={category.name}
                width={logotipo.ancho}
                height={logotipo.alto}
                className="block h-auto w-full"
              />
            </h1>
          ) : (
            <div className="relative z-10 flex items-center gap-3 py-6">
              <CategoryIcon
                slug={category.slug}
                strokeWidth={2.4}
                className="h-9 w-9 shrink-0 text-negro"
              />
              <h1 className="texto-rotulo m-0 font-display text-[38px] leading-[0.9] text-hueso uppercase">
                {category.name}
              </h1>
            </div>
          )}
        </div>
      </header>

      {/* Progreso de la categoría, sobre negro para que el amarillo mande. */}
      <div className="anim-fila relative" style={{ "--retardo": "0.1s" } as React.CSSProperties}>
        <div className="barra-xp relative h-4 overflow-hidden bg-[#242424]">
          <div
            className="barra-xp-relleno relative h-full bg-amarillo"
            style={
              {
                width: `${Math.round(category.progress * 100)}%`,
                "--retardo": "0.3s",
              } as React.CSSProperties
            }
          />
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-[10px] font-semibold tracking-[0.06em] text-hueso/75">
          <span>{category.currentXp} XP</span>
          <i className="h-[3px] w-[3px] rotate-45 bg-hueso/55" />
          <span>
            {category.atMaxLevel ? (
              <b className="text-amarillo">NIVEL MÁXIMO</b>
            ) : (
              <>
                <b className="text-amarillo">{category.xpToNextLevel}</b> AL NV{" "}
                {category.level + 1}
              </>
            )}
          </span>
        </div>
      </div>

      {/* ---- Focos ---- */}
      <h2
        className="anim-fila mt-10 inline-block bg-amarillo px-3 py-1 font-display text-[13px] text-negro uppercase"
        style={
          {
            transform: "skewX(-10deg)",
            "--retardo": "0.16s",
          } as React.CSSProperties
        }
      >
        <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
          Focos · {focuses.length}
        </span>
      </h2>

      {focuses.length > 0 && (
        <p
          className="anim-fila mt-2 text-[9px] font-bold tracking-[0.16em] text-hueso/40"
          style={{ "--retardo": "0.18s" } as React.CSSProperties}
        >
          PULSA PARA REGISTRAR
          {focuses.some((f) => f.frozen) &&
            " · PULSA UN CONGELADO PARA ENGENDRAR HIJO"}{" "}
          · MANTÉN PULSADO PARA BORRAR
        </p>
      )}

      {focuses.length === 0 ? (
        <p
          className="anim-fila mt-4 text-sm text-hueso/60"
          style={{ "--retardo": "0.2s" } as React.CSSProperties}
        >
          Esta categoría todavía no tiene focos.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3.5">
          {focuses.map((f, i) => {
            const padre =
              f.parentFocusId !== null
                ? focuses.find((p) => p.id === f.parentFocusId)
                : undefined;

            return (
              <li
                key={f.id}
                className={`tarjeta-categoria anim-tarjeta relative ${
                  f.id === focoNuevo ? "anim-destaca" : ""
                } ${padre ? "ml-7" : ""}`}
                style={
                  {
                    "--rotacion": GIROS[i % GIROS.length],
                    "--retardo": `${0.22 + i * 0.06}s`,
                  } as React.CSSProperties
                }
              >
                {focoEditando?.id === f.id ? (
                  // Panel de edición SUSTITUYE a FichaFoco entera, no va
                  // dentro: metido en su envoltorio (Link o pulsación
                  // mantenida), cualquier toque en el input arrancaría
                  // también el temporizador de pulsación larga.
                  <div
                    className="tarjeta-recorte bg-negro"
                    style={{ filter: `drop-shadow(6px 6px 0 ${acento})` }}
                  >
                    <div className="contenido-slam px-3.5 py-3.5">
                      <div className="campo-marco">
                        <input
                          value={nombreEditado}
                          onChange={(e) => setNombreEditado(e.target.value)}
                          autoFocus
                          className="campo"
                        />
                      </div>
                      {errorRenombrar && (
                        <p className="mt-2 text-[10px] font-bold text-cuerpo">
                          {errorRenombrar}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={onGuardarRenombrado}
                          disabled={renombrando || nombreEditado.trim() === ""}
                          className="boton-slam flex-1"
                        >
                          <span>{renombrando ? "Guardando…" : "Guardar"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFocoEditando(null)}
                          className="boton-slam flex-1"
                          style={{
                            background: "transparent",
                            color: "var(--color-hueso)",
                            boxShadow: "none",
                            border: "2px solid var(--color-hueso)",
                          }}
                        >
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setFocoEditando(f);
                        setNombreEditado(f.name);
                        setErrorRenombrar(null);
                      }}
                      className="absolute top-1.5 right-2 z-30 text-[9px] font-bold tracking-[0.14em] text-hueso/45 underline"
                    >
                      editar
                    </button>
                    <FichaFoco
                      frozen={f.frozen}
                      categoryId={categoryId}
                      focusId={f.id}
                      onMantener={() => {
                        setErrorBorrado(null);
                        setFocoABorrar(f);
                      }}
                      onEngendrar={() => setPadreEngendrar(f)}
                    >
                      <div
                        className="tarjeta-recorte bg-negro"
                        style={{ filter: `drop-shadow(6px 6px 0 ${acento})` }}
                      >
                        <div className="contenido-slam px-3.5 pt-3 pb-3.5">
                        <div className="flex items-center gap-2.5">
                          <h3 className="m-0 font-display text-[17px] leading-none text-hueso uppercase">
                            {f.name}
                          </h3>
                          {f.frozen && (
                            <span
                              className="bg-amarillo px-2 py-0.5 text-[8px] font-bold tracking-[0.18em] text-negro"
                              style={{ transform: "skewX(-10deg)" }}
                            >
                              CONGELADO
                            </span>
                          )}
                          <span className="ml-auto flex items-baseline gap-1 text-[9px] font-bold tracking-[0.16em] text-hueso/70">
                            NV{" "}
                            <b className="font-display text-[16px] tracking-normal text-hueso">
                              {f.level}
                            </b>
                          </span>
                        </div>

                        {padre && (
                          <p className="mt-1 text-[9px] font-bold tracking-[0.1em] text-hueso/45">
                            ↳ DE {padre.name}
                          </p>
                        )}

                        <div className="barra-xp relative mt-2.5 h-3 overflow-hidden bg-[#242424]">
                          <div
                            className="barra-xp-relleno relative h-full"
                            style={
                              {
                                width: `${Math.round(f.progress * 100)}%`,
                                background: f.frozen ? acento : "var(--color-amarillo)",
                                "--retardo": `${0.42 + i * 0.06}s`,
                              } as React.CSSProperties
                            }
                          />
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-[9.5px] font-semibold tracking-[0.06em] text-hueso/70">
                          <span>{f.currentXp} XP</span>
                          <i className="h-[3px] w-[3px] rotate-45 bg-hueso/50" />
                          <span>
                            {f.atMaxLevel ? (
                              <b className="text-amarillo">MAESTRÍA · NV 20</b>
                            ) : (
                              <>
                                <b className="text-amarillo">{f.xpToNextLevel}</b> AL NV{" "}
                                {f.level + 1}
                              </>
                            )}
                          </span>
                          {f.frozen && (
                            <span className="ml-auto text-[9px] font-bold tracking-[0.1em] text-amarillo">
                              TOCA PARA ENGENDRAR ↴
                            </span>
                          )}
                          </div>
                        </div>
                      </div>
                    </FichaFoco>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* ---- Nuevo foco ---- */}
      <form onSubmit={onCrearFocus} className="mt-11" ref={formularioRef}>
        <h2
          className="anim-fila inline-block bg-hueso px-3 py-1 font-display text-[13px] text-negro uppercase"
          style={
            {
              transform: "skewX(-10deg)",
              "--retardo": "0.3s",
            } as React.CSSProperties
          }
        >
          <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
            {padreEngendrar ? "Nuevo foco especializado" : "Nuevo foco"}
          </span>
        </h2>

        {padreEngendrar && (
          <p className="anim-slam mt-3 flex items-center gap-2 text-[11px] font-semibold text-hueso/70">
            <span
              className="bg-amarillo px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] text-negro"
              style={{ transform: "skewX(-10deg)" }}
            >
              HIJO DE {padreEngendrar.name.toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() => setPadreEngendrar(null)}
              className="text-hueso/50 underline"
            >
              cancelar
            </button>
          </p>
        )}

        <div
          className="anim-fila mt-4 flex items-stretch gap-3"
          style={{ "--retardo": "0.34s" } as React.CSSProperties}
        >
          <div className="campo-marco flex-1">
            <input
              ref={inputNombreRef}
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder={
                padreEngendrar
                  ? `Especialización de "${padreEngendrar.name}"…`
                  : "Arduino, Inglés, Pareja…"
              }
              required
              className="campo"
            />
          </div>
          <button
            type="submit"
            disabled={creando || nombreNuevo.trim() === ""}
            className="boton-slam shrink-0"
          >
            <span>
              {creando
                ? "Creando…"
                : padreEngendrar
                  ? "Engendrar"
                  : "Crear"}
            </span>
          </button>
        </div>

        {errorForm && (
          <p className="anim-slam mt-4 bg-cuerpo px-3 py-2 text-[11px] font-bold text-hueso">
            {errorForm}
          </p>
        )}
      </form>

      {/* ---- Historial ---- */}
      <h2
        className="anim-fila mt-11 inline-block bg-hueso px-3 py-1 font-display text-[13px] text-negro uppercase"
        style={
          {
            transform: "skewX(-10deg)",
            "--retardo": "0.38s",
          } as React.CSSProperties
        }
      >
        <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
          Historial · {activities.length}
        </span>
      </h2>

      {activities.some((a) => esDeHoy(a.date)) && (
        <p
          className="anim-fila mt-2 text-[9px] font-bold tracking-[0.16em] text-hueso/40"
          style={{ "--retardo": "0.4s" } as React.CSSProperties}
        >
          MANTÉN PULSADA UNA ACTIVIDAD DE HOY PARA DESHACERLA
        </p>
      )}

      {activities.length === 0 ? (
        <p
          className="anim-fila mt-4 text-sm text-hueso/60"
          style={{ "--retardo": "0.42s" } as React.CSSProperties}
        >
          Todavía no has registrado nada en esta categoría.
        </p>
      ) : (
        <>
          <ul className="mt-4 grid gap-2.5">
            {activities.slice(0, HISTORIAL_VISIBLE).map((a, i) => (
              <FilaActividad
                key={a.id}
                actividad={a}
                acento={acento}
                focusName={
                  a.focusId !== null
                    ? (focuses.find((f) => f.id === a.focusId)?.name ??
                      "foco borrado")
                    : null
                }
                retardo={0.44 + i * 0.04}
                onMantener={() => {
                  setErrorDeshacer(null);
                  setActividadADeshacer(a);
                }}
              />
            ))}
          </ul>

          {activities.length > HISTORIAL_VISIBLE && (
            <Link
              to={`/categories/${categoryId}/historial`}
              className="mt-3 inline-block text-[10px] font-bold tracking-[0.16em] text-amarillo underline"
            >
              VER HISTORIAL COMPLETO · Y {activities.length - HISTORIAL_VISIBLE} MÁS
            </Link>
          )}
        </>
      )}

      {focoABorrar && (
        <DialogoConfirmar
          tituloFranja="¿Borrar foco?"
          idTitulo="titulo-borrar-foco"
          procesando={borrando}
          error={errorBorrado}
          textoConfirmar="Borrar"
          textoProcesando="Borrando…"
          onConfirmar={onBorrarFoco}
          onCancelar={() => setFocoABorrar(null)}
        >
          <p className="m-0 font-display text-[20px] leading-tight text-hueso uppercase">
            {focoABorrar.name}
          </p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.14em] text-hueso/55">
            NIVEL {focoABorrar.level} · {focoABorrar.currentXp} XP
          </p>

          <p className="mt-4 text-[11.5px] leading-relaxed text-hueso/75">
            {(() => {
              const n = activities.filter(
                (a) => a.focusId === focoABorrar.id,
              ).length;
              if (n === 0) return "No tiene actividades registradas.";
              return (
                <>
                  Sus <b className="text-amarillo">{n}</b>{" "}
                  {n === 1 ? "actividad" : "actividades"} no se{" "}
                  {n === 1 ? "borra" : "borran"}: se{" "}
                  {n === 1 ? "queda" : "quedan"} en la categoría sin foco. La
                  XP que {n === 1 ? "te dio sigue" : "te dieron siguen"}{" "}
                  contando.
                </>
              );
            })()}
          </p>
        </DialogoConfirmar>
      )}

      {actividadADeshacer && (
        <DialogoConfirmar
          tituloFranja="¿Deshacer registro?"
          idTitulo="titulo-deshacer-actividad"
          procesando={deshaciendo}
          error={errorDeshacer}
          textoConfirmar="Deshacer"
          textoProcesando="Deshaciendo…"
          onConfirmar={onDeshacerActividad}
          onCancelar={() => setActividadADeshacer(null)}
        >
          <p className="m-0 font-display text-[18px] leading-tight text-hueso uppercase">
            {actividadADeshacer.description === ""
              ? "Sin descripción"
              : actividadADeshacer.description}
          </p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.14em] text-hueso/55">
            +{XP_POR_INTENSIDAD[actividadADeshacer.intensity]} XP ·{" "}
            {fechaRelativaCorta(actividadADeshacer.date)}
          </p>

          <p className="mt-4 text-[11.5px] leading-relaxed text-hueso/75">
            Se le resta esa XP al foco (si la tenía) y a la categoría, y el
            nivel puede bajar si corresponde. Solo puede deshacerse un
            registro de hoy.
          </p>
        </DialogoConfirmar>
      )}
    </div>
  );
}
