import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, type Category } from "../api/client";
import { categoryColorClass } from "../lib/categoryColor";

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

  if (loading) return <p className="text-hueso/60">Cargando categorías…</p>;
  if (error) return <p className="text-cuerpo">Error: {error}</p>;

  return (
    <div>
      <h2 className="font-display text-3xl uppercase text-amarillo">
        Categorías
      </h2>

      <ul className="mt-6 grid max-w-lg gap-3">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              to={`/categories/${c.id}`}
              className={`${categoryColorClass(c.slug)} block px-5 py-4 text-hueso`}
            >
              <span className="font-display text-xl uppercase">{c.name}</span>
              <span className="ml-3 text-sm opacity-80">
                nivel {c.level} · {c.currentXp} XP
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to="/log-activity"
        className="mt-8 inline-block bg-amarillo px-5 py-3 font-display uppercase text-negro"
      >
        Registrar actividad
      </Link>
    </div>
  );
}
