import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  deleteActivity,
  getActivitiesByCategory,
  getCategory,
  getFocusesByCategory,
  type Activity,
  type Category,
  type Focus,
} from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { fechaRelativaCorta } from "../lib/fecha";
import { FilaActividad } from "../components/FilaActividad";
import { DialogoConfirmar } from "../components/DialogoConfirmar";
import { XP_POR_INTENSIDAD } from "../lib/intensity";
import { TarjetasEsqueleto } from "../components/TarjetasEsqueleto";
import { PanelError } from "../components/PanelError";

/**
 * Historial completo de una categoría, agrupado por día. El detalle de
 * categoría solo enseña las últimas HISTORIAL_VISIBLE; esta pantalla es a
 * donde lleva "Y N MÁS" para ver el resto.
 */
export function CategoryHistoryPage() {
  const { id } = useParams();
  const categoryId = Number(id);
  const idValido = Number.isInteger(categoryId);

  const [category, setCategory] = useState<Category | null>(null);
  const [focuses, setFocuses] = useState<Focus[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deshacer por pulsación mantenida, igual que en el detalle de categoría.
  const [actividadADeshacer, setActividadADeshacer] = useState<Activity | null>(
    null,
  );
  const [deshaciendo, setDeshaciendo] = useState(false);
  const [errorDeshacer, setErrorDeshacer] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!idValido) return;

    Promise.all([
      getCategory(categoryId),
      getFocusesByCategory(categoryId),
      getActivitiesByCategory(categoryId),
    ])
      .then(([cat, focs, acts]) => {
        setCategory(cat);
        setFocuses(focs);
        setActivities(acts);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [categoryId, idValido]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // El reset de loading/error vive en el evento que lo provoca (el botón),
  // no dentro del efecto.
  function onReintentar() {
    setLoading(true);
    setError(null);
    cargar();
  }

  async function onDeshacerActividad() {
    if (!actividadADeshacer) return;
    setErrorDeshacer(null);
    setDeshaciendo(true);

    try {
      await deleteActivity(actividadADeshacer.id);
      setActividadADeshacer(null);
      // Solo hace falta recargar la lista: el nivel/XP de la categoría no se
      // muestran en esta pantalla.
      setActivities(await getActivitiesByCategory(categoryId));
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
        <TarjetasEsqueleto n={4} altura="72px" />
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

  // Agrupado por día natural. La lista ya llega ordenada por fecha
  // descendente (getActivitiesByCategory), así que agrupar es solo detectar
  // cuándo cambia la etiqueta respecto al grupo anterior.
  const grupos: { etiqueta: string; items: Activity[] }[] = [];
  for (const a of activities) {
    const etiqueta = fechaRelativaCorta(a.date);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.etiqueta === etiqueta) {
      ultimo.items.push(a);
    } else {
      grupos.push({ etiqueta, items: [a] });
    }
  }

  return (
    <div className="px-4 pt-6 pb-32">
      <Link
        to={`/categories/${categoryId}`}
        className="anim-fila inline-block bg-hueso px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-negro"
        style={{ transform: "skewX(-10deg)" }}
      >
        <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
          ← {category.name.toUpperCase()}
        </span>
      </Link>

      <h1
        className="texto-rotulo anim-fila mt-6 mb-1 font-display text-[28px] leading-[0.95] text-hueso uppercase"
        style={{ "--retardo": "0.05s" } as React.CSSProperties}
      >
        Historial
      </h1>
      <p
        className="anim-fila mb-8 text-[10px] font-bold tracking-[0.16em] text-hueso/40"
        style={{ "--retardo": "0.08s" } as React.CSSProperties}
      >
        {activities.length} {activities.length === 1 ? "ACTIVIDAD" : "ACTIVIDADES"} EN
        TOTAL
      </p>

      {activities.length === 0 ? (
        <p className="text-sm text-hueso/60">
          Todavía no has registrado nada en esta categoría.
        </p>
      ) : (
        grupos.map((g, gi) => (
          <div key={`${g.etiqueta}-${gi}`} className="mb-8">
            <p
              className="anim-fila mb-2.5 inline-block bg-amarillo px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-negro"
              style={
                {
                  transform: "skewX(-10deg)",
                  "--retardo": `${0.1 + gi * 0.03}s`,
                } as React.CSSProperties
              }
            >
              <span
                className="inline-block"
                style={{ transform: "skewX(10deg)" }}
              >
                {g.etiqueta}
              </span>
            </p>
            <ul className="grid gap-2.5">
              {g.items.map((a, i) => (
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
                  retardo={0.12 + gi * 0.03 + i * 0.02}
                  onMantener={() => {
                    setErrorDeshacer(null);
                    setActividadADeshacer(a);
                  }}
                />
              ))}
            </ul>
          </div>
        ))
      )}

      {actividadADeshacer && (
        <DialogoConfirmar
          tituloFranja="¿Deshacer registro?"
          idTitulo="titulo-deshacer-historial"
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
