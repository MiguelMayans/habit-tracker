import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  createActivity,
  getCategories,
  getFocusesByCategory,
  type Category,
  type Focus,
  type Intensity,
  type RegisterActivityResult,
} from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";

const INTENSIDADES: {
  valor: Intensity;
  etiqueta: string;
  xp: number;
  giro: string;
}[] = [
  { valor: "chispa", etiqueta: "Chispa", xp: 10, giro: "-1.4deg" },
  { valor: "impulso", etiqueta: "Impulso", xp: 20, giro: "0.9deg" },
  { valor: "all_out", etiqueta: "All-Out", xp: 35, giro: "-1deg" },
];

/**
 * "Ahora" en el formato local que espera datetime-local. El registro es
 * siempre retroactivo (docs/DESIGN.md), así que no tiene sentido poder elegir
 * una fecha futura.
 */
function ahoraLocal(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

/** Solo se acepta el parámetro si es un entero: viene de la URL. */
function paramEntero(params: URLSearchParams, nombre: string): string {
  const valor = params.get(nombre);
  return valor !== null && /^\d+$/.test(valor) ? valor : "";
}

export function LogActivityPage() {
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [focuses, setFocuses] = useState<Focus[]>([]);

  // Contexto de origen: si vienes de una categoría o de un foco, llegan ya
  // elegidos. Se lee una sola vez, al montar.
  const [categoryId, setCategoryId] = useState(() =>
    paramEntero(searchParams, "categoria"),
  );
  const [focusId, setFocusId] = useState(() =>
    paramEntero(searchParams, "foco"),
  );
  const [categoriaDeOrigen] = useState(() =>
    paramEntero(searchParams, "categoria"),
  );
  // Si vienes de un foco, la categoría viene decidida: cambiarla invalidaría
  // el foco. Se puede desbloquear a mano.
  const [categoriaFijada, setCategoriaFijada] = useState(
    () => paramEntero(searchParams, "foco") !== "",
  );
  const [description, setDescription] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("chispa");
  const [date, setDate] = useState("");
  const [editandoFecha, setEditandoFecha] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<RegisterActivityResult | null>(
    null,
  );

  useEffect(() => {
    getCategories()
      .then((cats) => {
        setCategories(cats);
        // La categoría puede venir de la URL: si no existe, se descarta aquí
        // en vez de dejar que el fallo salte al enviar.
        setCategoryId((actual) =>
          actual === "" || cats.some((c) => String(c.id) === actual)
            ? actual
            : "",
        );
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  // Cambiar de categoría invalida el foco elegido y la lista: se limpia en el
  // propio evento, no en un efecto.
  function onCambiarCategoria(value: string) {
    setCategoryId(value);
    setFocusId("");
    setFocuses([]);
  }

  function desbloquearCategoria() {
    setCategoriaFijada(false);
    setFocusId("");
  }

  // Los focos dependen de la categoría elegida.
  useEffect(() => {
    if (categoryId === "") return;

    // Descarta la respuesta si mientras tanto se ha cambiado de categoría.
    let cancelado = false;

    getFocusesByCategory(Number(categoryId))
      .then((f) => {
        if (cancelado) return;
        setFocuses(f);
        // Mismo criterio que con la categoría: un foco de la URL que no exista
        // o esté congelado se descarta antes de poder enviarlo.
        setFocusId((actual) =>
          actual === "" ||
          f.some((x) => String(x.id) === actual && !x.frozen)
            ? actual
            : "",
        );
      })
      .catch((e: Error) => {
        if (!cancelado) setError(e.message);
      });

    return () => {
      cancelado = true;
    };
  }, [categoryId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResultado(null);
    setEnviando(true);

    try {
      const res = await createActivity({
        categoryId: Number(categoryId),
        focusId: focusId === "" ? undefined : Number(focusId),
        description,
        intensity,
        // Sin fecha, el backend usa la actual.
        date: date === "" ? undefined : new Date(date).toISOString(),
      });

      setResultado(res);
      setDescription("");
      setDate("");
      setEditandoFecha(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const seleccionada = categories.find((c) => String(c.id) === categoryId);
  const acento = seleccionada
    ? categoryColorVar(seleccionada.slug)
    : "var(--color-amarillo)";

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

      {/* La banda toma el color de la categoría elegida: la cabecera responde
          a lo que estás rellenando. */}
      <header className="relative mt-7 mb-9">
        <div
          className="banda-sangre anim-logo top-[-18px] z-0 h-[96px]"
          style={
            {
              "--banda-fondo": acento,
              "--banda-reborde": "var(--color-negro)",
              "--banda-giro": "3deg",
              transition: "background-color .12s steps(2)",
            } as React.CSSProperties
          }
        />
        <h1 className="texto-rotulo relative z-10 m-0 font-display text-[34px] leading-[0.92] text-hueso uppercase">
          Registrar
        </h1>
      </header>

      <form onSubmit={onSubmit} className="grid gap-6">
        <label
          className="anim-fila grid gap-2"
          style={{ "--retardo": "0.06s" } as React.CSSProperties}
        >
          <span className="etiqueta-campo justify-self-start">
            <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
              CATEGORÍA
            </span>
          </span>
          {categoriaFijada && seleccionada ? (
            // Fijada porque vienes de un foco suyo: cambiarla dejaría el foco
            // huérfano. Se muestra, no se edita, y se puede soltar a mano.
            <div
              className="campo-marco flex items-center"
              style={{ borderColor: acento }}
            >
              <span
                className="campo flex items-center gap-2.5"
                style={{ width: "auto", flex: 1 }}
              >
                <i
                  className="h-3 w-3 shrink-0"
                  style={{ background: acento, transform: "skewX(-10deg)" }}
                />
                {seleccionada.name}
              </span>
              <button
                type="button"
                onClick={desbloquearCategoria}
                className="mr-3 shrink-0 text-[9px] font-bold tracking-[0.16em] text-amarillo underline"
                style={{ transform: "skewX(7deg)" }}
              >
                CAMBIAR
              </button>
            </div>
          ) : (
            <div className="campo-marco">
              <select
                value={categoryId}
                onChange={(e) => onCambiarCategoria(e.target.value)}
                required
                className="campo"
              >
                <option value="">— Elige una —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · NV {c.level}
                  </option>
                ))}
              </select>
            </div>
          )}
        </label>

        <label
          className="anim-fila grid gap-2"
          style={{ "--retardo": "0.12s" } as React.CSSProperties}
        >
          <span className="etiqueta-campo justify-self-start">
            <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
              FOCO · OPCIONAL
            </span>
          </span>
          <div className={`campo-marco ${categoryId === "" ? "opacity-40" : ""}`}>
            <select
              value={focusId}
              onChange={(e) => setFocusId(e.target.value)}
              disabled={categoryId === ""}
              className="campo"
            >
              <option value="">— Sin foco —</option>
              {focuses.map((f) => (
                <option key={f.id} value={f.id} disabled={f.frozen}>
                  {f.name} · NV {f.level}
                  {f.frozen ? " (congelado)" : ""}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label
          className="anim-fila grid gap-2"
          style={{ "--retardo": "0.18s" } as React.CSSProperties}
        >
          <span className="etiqueta-campo justify-self-start">
            <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
              QUÉ HICISTE · OPCIONAL
            </span>
          </span>
          <div className="campo-marco">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Si te apetece contarlo."
              className="campo resize-none"
            />
          </div>
        </label>

        {/* Tres fichas en vez de un desplegable: la intensidad es la decisión
            con más peso del formulario y merece verse entera. */}
        <fieldset
          className="anim-fila m-0 grid gap-2 border-0 p-0"
          style={{ "--retardo": "0.24s" } as React.CSSProperties}
        >
          <legend className="etiqueta-campo mb-2">
            <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
              INTENSIDAD
            </span>
          </legend>
          <div className="grid grid-cols-3 gap-3">
            {INTENSIDADES.map((i) => (
              <button
                key={i.valor}
                type="button"
                aria-pressed={intensity === i.valor}
                onClick={() => setIntensity(i.valor)}
                className="ficha-intensidad"
                style={{ "--rotacion": i.giro } as React.CSSProperties}
              >
                <span className="block">
                  <span className="block text-[13px] leading-tight">
                    {i.etiqueta}
                  </span>
                  <span className="mt-1 block font-display text-[17px] leading-none">
                    {i.xp}
                    <span className="text-[9px]"> XP</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div
          className="anim-fila grid gap-2"
          style={{ "--retardo": "0.3s" } as React.CSSProperties}
        >
          <span className="etiqueta-campo justify-self-start">
            <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
              CUÁNDO
            </span>
          </span>

          {date === "" && !editandoFecha ? (
            // El caso normal es registrar algo recién hecho, así que por
            // defecto se afirma "ahora" en vez de plantar un selector de fecha
            // que casi nunca se toca.
            <button
              type="button"
              onClick={() => setEditandoFecha(true)}
              className="campo-marco flex items-center text-left"
            >
              <span className="campo flex-1" style={{ width: "auto" }}>
                Ahora
              </span>
              <span
                className="mr-3 shrink-0 text-[9px] font-bold tracking-[0.16em] text-amarillo underline"
                style={{ transform: "skewX(7deg)" }}
              >
                OTRO MOMENTO
              </span>
            </button>
          ) : (
            <div className="campo-marco flex items-center">
              <input
                type="datetime-local"
                value={date}
                max={ahoraLocal()}
                autoFocus
                onChange={(e) => setDate(e.target.value)}
                className="campo flex-1"
                style={{ width: "auto" }}
              />
              <button
                type="button"
                onClick={() => {
                  setDate("");
                  setEditandoFecha(false);
                }}
                className="mr-3 shrink-0 text-[9px] font-bold tracking-[0.16em] text-amarillo underline"
                style={{ transform: "skewX(7deg)" }}
              >
                AHORA
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={enviando || categoryId === ""}
          className="boton-slam anim-fila mt-1 w-full"
          style={{ "--retardo": "0.36s" } as React.CSSProperties}
        >
          <span>{enviando ? "Registrando…" : "Registrar"}</span>
        </button>
      </form>

      {error && (
        <p className="anim-slam mt-6 bg-cuerpo px-4 py-3 text-[12px] font-bold text-hueso">
          {error}
        </p>
      )}

      {resultado && (
        <PanelResultado resultado={resultado} volverA={categoriaDeOrigen} />
      )}
    </div>
  );
}

function PanelResultado({
  resultado,
  volverA,
}: {
  resultado: RegisterActivityResult;
  /** Id de la categoría de la que venías, si el registro llegó con contexto. */
  volverA: string;
}) {
  const subeAlguno =
    resultado.category.leveledUp || Boolean(resultado.focus?.leveledUp);

  // En móvil el panel aparece por debajo del pliegue y te lo pierdes. Se
  // trae a la vista al llegar, que es justo el momento con más carga.
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div
      ref={panel}
      // La key hace que el panel se remonte en cada registro, y con ello se
      // reproduzcan otra vez las animaciones de llegada.
      key={resultado.activity.id}
      className={`anim-slam relative mt-8 overflow-hidden bg-negro ${
        subeAlguno ? "anim-flash-nivel" : ""
      }`}
      style={{ boxShadow: "8px 8px 0 var(--color-amarillo)" }}
    >
      <div className="px-5 py-5">
        <p className="texto-rotulo m-0 font-display text-[46px] leading-none text-amarillo">
          +{resultado.xpGained}
          <span className="text-[20px]"> XP</span>
        </p>

        <div className="mt-5 grid gap-3">
          <FilaXp titulo="Categoría" datos={resultado.category} />
          {resultado.focus && (
            <FilaXp titulo="Foco" datos={resultado.focus} />
          )}
        </div>

        {/* Devuelve de donde viniste, no siempre a la home. */}
        <Link
          to={volverA === "" ? "/" : `/categories/${volverA}`}
          className="boton-slam mt-6 w-full"
        >
          <span>{volverA === "" ? "Ver categorías" : "Volver"}</span>
        </Link>
      </div>
    </div>
  );
}

function FilaXp({
  titulo,
  datos,
}: {
  titulo: string;
  datos: RegisterActivityResult["category"];
}) {
  return (
    <div className="flex items-center gap-3 border-t-2 border-hueso/15 pt-3">
      <span className="text-[10px] font-bold tracking-[0.18em] text-hueso/60 uppercase">
        {titulo}
      </span>
      <span className="ml-auto flex items-baseline gap-2">
        {datos.leveledUp ? (
          <span
            className="bg-amarillo px-2 py-0.5 text-[9px] font-bold tracking-[0.16em] text-negro"
            style={{ transform: "skewX(-10deg)" }}
          >
            NV {datos.levelBefore} → {datos.levelAfter}
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-hueso/60">
            NV {datos.levelAfter}
          </span>
        )}
        <span className="font-display text-[15px] text-hueso">
          {datos.totalXp}
          <span className="text-[9px]"> XP</span>
        </span>
      </span>
    </div>
  );
}
