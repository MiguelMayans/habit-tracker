import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createActivity,
  getCategories,
  getFocusesByCategory,
  type Category,
  type Focus,
  type Intensity,
  type RegisterActivityResult,
} from "../api/client";

const INTENSIDADES: { valor: Intensity; etiqueta: string }[] = [
  { valor: "chispa", etiqueta: "Chispa (10 XP)" },
  { valor: "impulso", etiqueta: "Impulso (20 XP)" },
  { valor: "all_out", etiqueta: "All-Out (35 XP)" },
];

export function LogActivityPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [focuses, setFocuses] = useState<Focus[]>([]);

  const [categoryId, setCategoryId] = useState("");
  const [focusId, setFocusId] = useState("");
  const [description, setDescription] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("chispa");
  const [date, setDate] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<RegisterActivityResult | null>(
    null,
  );

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((e: Error) => setError(e.message));
  }, []);

  // Cambiar de categoría invalida el foco elegido y la lista: se limpia en el
  // propio evento, no en un efecto.
  function onCambiarCategoria(value: string) {
    setCategoryId(value);
    setFocusId("");
    setFocuses([]);
  }

  // Los focos dependen de la categoría elegida.
  useEffect(() => {
    if (categoryId === "") return;

    // Descarta la respuesta si mientras tanto se ha cambiado de categoría.
    let cancelado = false;

    getFocusesByCategory(Number(categoryId))
      .then((f) => {
        if (!cancelado) setFocuses(f);
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
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="font-display text-3xl uppercase text-amarillo">
        Registrar actividad
      </h2>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-hueso/60">Categoría</span>
          <select
            value={categoryId}
            onChange={(e) => onCambiarCategoria(e.target.value)}
            required
            className="border border-hueso/30 bg-negro px-3 py-2 text-hueso"
          >
            <option value="">— Elige una categoría —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-hueso/60">Foco (opcional)</span>
          <select
            value={focusId}
            onChange={(e) => setFocusId(e.target.value)}
            disabled={categoryId === ""}
            className="border border-hueso/30 bg-negro px-3 py-2 text-hueso disabled:opacity-40"
          >
            <option value="">— Sin foco —</option>
            {focuses.map((f) => (
              <option key={f.id} value={f.id} disabled={f.frozen}>
                {f.name}
                {f.frozen ? " (congelado)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-hueso/60">Descripción</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="border border-hueso/30 bg-transparent px-3 py-2 text-hueso"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-hueso/60">Intensidad</span>
          <select
            value={intensity}
            onChange={(e) => setIntensity(e.target.value as Intensity)}
            className="border border-hueso/30 bg-negro px-3 py-2 text-hueso"
          >
            {INTENSIDADES.map((i) => (
              <option key={i.valor} value={i.valor}>
                {i.etiqueta}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-hueso/60">
            Fecha (opcional — vacío = ahora)
          </span>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-hueso/30 bg-transparent px-3 py-2 text-hueso"
          />
        </label>

        <button
          type="submit"
          disabled={enviando || categoryId === ""}
          className="bg-amarillo px-5 py-3 font-display uppercase text-negro disabled:opacity-40"
        >
          {enviando ? "Registrando…" : "Registrar"}
        </button>
      </form>

      {error && <p className="mt-4 text-cuerpo">Error: {error}</p>}

      {resultado && (
        <div className="mt-6 border border-amarillo px-5 py-4">
          <p className="font-display text-xl uppercase text-amarillo">
            +{resultado.xpGained} XP
          </p>

          <p className="mt-2 text-sm text-hueso">
            Categoría: nivel {resultado.category.levelAfter} ·{" "}
            {resultado.category.totalXp} XP
            {resultado.category.leveledUp && (
              <span className="ml-2 text-amarillo">
                ¡SUBE DE NIVEL! ({resultado.category.levelBefore} →{" "}
                {resultado.category.levelAfter})
              </span>
            )}
          </p>

          {resultado.focus && (
            <p className="mt-1 text-sm text-hueso">
              Foco: nivel {resultado.focus.levelAfter} ·{" "}
              {resultado.focus.totalXp} XP
              {resultado.focus.leveledUp && (
                <span className="ml-2 text-amarillo">
                  ¡SUBE DE NIVEL! ({resultado.focus.levelBefore} →{" "}
                  {resultado.focus.levelAfter})
                </span>
              )}
            </p>
          )}

          <Link to="/" className="mt-4 inline-block text-sm underline">
            ← Volver a categorías
          </Link>
        </div>
      )}
    </div>
  );
}
