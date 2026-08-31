import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createFocus,
  deleteFocus,
  getActivitiesByCategory,
  getCategory,
  getFocusesByCategory,
  type Activity,
  type Category,
  type Focus,
  type Intensity,
} from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { CategoryIcon } from "../components/CategoryIcon";
import { fechaRelativaCorta } from "../lib/fecha";
import { usePulsacionLarga } from "../lib/usePulsacionLarga";
import { DialogoBorrarFoco } from "../components/DialogoBorrarFoco";

/** Cuántas actividades se listan antes de cortar. */
const HISTORIAL_VISIBLE = 8;

const XP_POR_INTENSIDAD: Record<Intensity, number> = {
  chispa: 10,
  impulso: 20,
  all_out: 35,
};

/** Giro alterno de las fichas de foco, para el efecto collage. */
const GIROS = ["-0.9deg", "0.7deg", "-0.5deg", "1deg", "-0.7deg"];

/**
 * Pulsar un foco lleva a registrar actividad EN ese foco, con categoría y
 * foco ya elegidos.
 *
 * Un foco congelado no se enlaza: está en el nivel máximo y el backend
 * rechazaría la actividad, así que ofrecer el atajo sería llevar a un error.
 */
function FichaFoco({
  frozen,
  categoryId,
  focusId,
  onMantener,
  children,
}: {
  frozen: boolean;
  categoryId: number;
  focusId: number;
  onMantener: () => void;
  children: React.ReactNode;
}) {
  const pulsacion = usePulsacionLarga(onMantener);

  // Un foco congelado no lleva a registrar, pero sí se puede borrar: por eso
  // sigue teniendo pulsación mantenida aunque no sea un enlace.
  if (frozen) {
    return (
      <div className="pulsable-larga block" {...pulsacion}>
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

  // Borrado por pulsación mantenida.
  const [focoABorrar, setFocoABorrar] = useState<Focus | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);

  const cargarFocuses = useCallback(async () => {
    setFocuses(await getFocusesByCategory(categoryId));
  }, [categoryId]);

  // Se deriva en render, no en un efecto: no depende de nada externo.
  const idValido = Number.isInteger(categoryId);

  useEffect(() => {
    if (!idValido) return;

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

  async function onCrearFocus(e: React.FormEvent) {
    e.preventDefault();
    setErrorForm(null);
    setCreando(true);

    try {
      const creado = await createFocus({ categoryId, name: nombreNuevo });
      setNombreNuevo("");
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

  if (!idValido)
    return (
      <p className="px-6 py-10 text-cuerpo">El id de la categoría no es válido</p>
    );
  if (loading) return <p className="px-6 py-10 text-hueso/60">Cargando…</p>;
  if (error) return <p className="px-6 py-10 text-cuerpo">Error: {error}</p>;
  if (!category) return null;

  const acento = categoryColorVar(category.slug);

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
      <header className="relative mt-7 mb-9">
        <div
          className="banda-sangre anim-logo top-[-18px] z-0 h-[104px]"
          style={
            {
              "--banda-fondo": acento,
              "--banda-reborde": "var(--color-negro)",
            } as React.CSSProperties
          }
        />

        <div className="relative z-10 flex items-end gap-3">
          <h1 className="texto-rotulo m-0 font-display text-[38px] leading-[0.9] text-hueso uppercase">
            {category.name}
          </h1>
          <span className="ml-auto flex items-baseline gap-1.5 pb-1">
            <span className="texto-contorno text-[9px] font-bold tracking-[0.24em] text-hueso">
              NIVEL
            </span>
            <b className="texto-rotulo font-display text-[42px] leading-[0.82] text-amarillo">
              {category.level}
            </b>
          </span>
        </div>
      </header>

      {/* Progreso de la categoría, sobre negro para que el amarillo mande. */}
      <div className="anim-fila relative" style={{ "--retardo": "0.1s" } as React.CSSProperties}>
        <CategoryIcon
          slug={category.slug}
          className="pointer-events-none absolute right-1 -top-2 h-16 w-16 opacity-20"
          style={{ color: acento }}
        />
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
          PULSA PARA REGISTRAR · MANTÉN PULSADO PARA BORRAR
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
          {focuses.map((f, i) => (
            <li
              key={f.id}
              className={`tarjeta-categoria anim-tarjeta relative ${
                f.id === focoNuevo ? "anim-destaca" : ""
              }`}
              style={
                {
                  "--rotacion": GIROS[i % GIROS.length],
                  "--retardo": `${0.22 + i * 0.06}s`,
                } as React.CSSProperties
              }
            >
              <FichaFoco
                frozen={f.frozen}
                categoryId={categoryId}
                focusId={f.id}
                onMantener={() => {
                  setErrorBorrado(null);
                  setFocoABorrar(f);
                }}
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
                    </div>
                  </div>
                </div>
              </FichaFoco>
            </li>
          ))}
        </ul>
      )}

      {/* ---- Nuevo foco ---- */}
      <form onSubmit={onCrearFocus} className="mt-11">
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
            Nuevo foco
          </span>
        </h2>

        <div
          className="anim-fila mt-4 flex items-stretch gap-3"
          style={{ "--retardo": "0.34s" } as React.CSSProperties}
        >
          <div className="campo-marco flex-1">
            <input
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder="Arduino, Inglés, Pareja…"
              required
              className="campo"
            />
          </div>
          <button
            type="submit"
            disabled={creando || nombreNuevo.trim() === ""}
            className="boton-slam shrink-0"
          >
            <span>{creando ? "Creando…" : "Crear"}</span>
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
              <li
                key={a.id}
                className="anim-fila relative bg-[#111] py-2.5 pr-3 pl-3.5"
                style={
                  {
                    borderLeft: `5px solid ${acento}`,
                    "--retardo": `${0.44 + i * 0.04}s`,
                  } as React.CSSProperties
                }
              >
                <div className="flex items-baseline gap-3">
                  <p
                    className={`m-0 flex-1 text-[12px] leading-snug font-semibold ${
                      a.description === "" ? "text-hueso/40 italic" : "text-hueso"
                    }`}
                  >
                    {a.description === "" ? "Sin descripción" : a.description}
                  </p>
                  <span className="shrink-0 text-[9px] font-bold tracking-[0.14em] text-hueso/50">
                    {fechaRelativaCorta(a.date)}
                  </span>
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className="bg-amarillo px-1.5 py-0.5 font-display text-[10px] text-negro"
                    style={{ transform: "skewX(-10deg)" }}
                  >
                    +{XP_POR_INTENSIDAD[a.intensity]} XP
                  </span>
                  {a.focusId !== null && (
                    <span className="text-[9.5px] font-semibold tracking-[0.06em] text-hueso/55">
                      ↳{" "}
                      {focuses.find((f) => f.id === a.focusId)?.name ??
                        "foco borrado"}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {activities.length > HISTORIAL_VISIBLE && (
            <p className="mt-3 text-[10px] font-bold tracking-[0.16em] text-hueso/45">
              Y {activities.length - HISTORIAL_VISIBLE} MÁS
            </p>
          )}
        </>
      )}

      {focoABorrar && (
        <DialogoBorrarFoco
          foco={focoABorrar}
          actividades={
            activities.filter((a) => a.focusId === focoABorrar.id).length
          }
          borrando={borrando}
          error={errorBorrado}
          onConfirmar={onBorrarFoco}
          onCancelar={() => setFocoABorrar(null)}
        />
      )}
    </div>
  );
}
