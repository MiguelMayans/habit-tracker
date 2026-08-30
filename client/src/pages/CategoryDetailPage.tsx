import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createFocus,
  getCategory,
  getFocusesByCategory,
  type Category,
  type Focus,
} from "../api/client";
import { categoryColorClass } from "../lib/categoryColor";

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

    Promise.all([getCategory(categoryId), getFocusesByCategory(categoryId)])
      .then(([cat, focs]) => {
        if (cancelado) return;
        setCategory(cat);
        setFocuses(focs);
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
      await createFocus({ categoryId, name: nombreNuevo });
      setNombreNuevo("");
      // Refresca solo la lista, sin recargar la página.
      await cargarFocuses();
    } catch (err) {
      setErrorForm((err as Error).message);
    } finally {
      setCreando(false);
    }
  }

  if (!idValido)
    return <p className="text-cuerpo">El id de la categoría no es válido</p>;
  if (loading) return <p className="text-hueso/60">Cargando…</p>;
  if (error) return <p className="text-cuerpo">Error: {error}</p>;
  if (!category) return null;

  return (
    <div>
      <Link to="/" className="text-sm text-hueso/60 underline">
        ← Categorías
      </Link>

      <div
        className={`${categoryColorClass(category.slug)} mt-4 px-5 py-4 text-hueso`}
      >
        <h2 className="font-display text-3xl uppercase">{category.name}</h2>
        <p className="text-sm opacity-80">
          nivel {category.level} · {category.currentXp} XP
        </p>
      </div>

      <h3 className="mt-8 font-display text-xl uppercase text-amarillo">
        Focos ({focuses.length})
      </h3>

      {focuses.length === 0 ? (
        <p className="mt-2 text-sm text-hueso/60">
          Esta categoría todavía no tiene focos.
        </p>
      ) : (
        <ul className="mt-3 grid max-w-lg gap-2">
          {focuses.map((f) => (
            <li
              key={f.id}
              className="border border-hueso/20 px-4 py-3 text-hueso"
            >
              <span className="font-display uppercase">{f.name}</span>
              <span className="ml-3 text-sm text-hueso/60">
                nivel {f.level} · {f.currentXp} XP
              </span>
              {f.frozen && (
                <span className="ml-3 text-sm text-amarillo">CONGELADO</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onCrearFocus} className="mt-8 max-w-lg">
        <h3 className="font-display text-xl uppercase text-amarillo">
          Nuevo foco
        </h3>

        <div className="mt-3 flex gap-2">
          <input
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder="Nombre del foco"
            required
            className="flex-1 border border-hueso/30 bg-transparent px-3 py-2 text-hueso"
          />
          <button
            type="submit"
            disabled={creando || nombreNuevo.trim() === ""}
            className="bg-amarillo px-4 py-2 font-display uppercase text-negro disabled:opacity-40"
          >
            {creando ? "Creando…" : "Crear"}
          </button>
        </div>

        {errorForm && <p className="mt-2 text-sm text-cuerpo">{errorForm}</p>}
      </form>
    </div>
  );
}
