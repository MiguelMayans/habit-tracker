import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CategoryDetailPage } from "./pages/CategoryDetailPage";
import { LogActivityPage } from "./pages/LogActivityPage";
import { FabRegistrar } from "./components/FabRegistrar";

function App() {
  return (
    <BrowserRouter>
      {/* Las texturas viven en el layout, no en cada pantalla: son el fondo de
          la app entera. Van DETRÁS del contenido y con pointer-events none. */}
      <div className="relative min-h-screen overflow-hidden bg-negro">
        <div className="textura-diagonales" />
        <div className="textura-trama" />

        <main className="relative z-10 mx-auto w-full max-w-md">
          <Routes>
            <Route path="/" element={<CategoriesPage />} />
            <Route path="/categories/:id" element={<CategoryDetailPage />} />
            <Route path="/log-activity" element={<LogActivityPage />} />
            <Route
              path="*"
              element={
                <p className="px-6 py-10 text-hueso/60">Página no encontrada</p>
              }
            />
          </Routes>
        </main>

        <FabRegistrar />
      </div>
    </BrowserRouter>
  );
}

export default App;
