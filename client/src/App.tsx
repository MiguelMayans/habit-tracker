import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CategoryDetailPage } from "./pages/CategoryDetailPage";
import { LogActivityPage } from "./pages/LogActivityPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-negro">
        <header className="flex items-baseline gap-6 border-b border-hueso/15 px-8 py-5">
          <Link to="/" className="font-display text-2xl uppercase text-amarillo">
            Habits
          </Link>
          <nav className="flex gap-4 text-sm text-hueso/70">
            <Link to="/">Categorías</Link>
            <Link to="/log-activity">Registrar actividad</Link>
          </nav>
        </header>

        <main className="px-8 py-8">
          <Routes>
            <Route path="/" element={<CategoriesPage />} />
            <Route path="/categories/:id" element={<CategoryDetailPage />} />
            <Route path="/log-activity" element={<LogActivityPage />} />
            <Route
              path="*"
              element={<p className="text-hueso/60">Página no encontrada</p>}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
