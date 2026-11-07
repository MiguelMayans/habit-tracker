import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CategoryDetailPage } from "./pages/CategoryDetailPage";
import { CategoryHistoryPage } from "./pages/CategoryHistoryPage";
import { LogActivityPage } from "./pages/LogActivityPage";
import { MissionsPage } from "./pages/MissionsPage";
import { LairPage } from "./pages/LairPage";
import { BottomNav } from "./components/BottomNav";
import { ScreenTransition } from "./components/ScreenTransition";
import { UnlockScreen } from "./components/UnlockScreen";
import { UpdateBanner } from "./components/UpdateBanner";
import { LOCKED_EVENT } from "./lib/apiKey";

function App() {
  // The server rejected the key (see lib/apiKey.ts): ask for it.
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const lock = () => setLocked(true);
    window.addEventListener(LOCKED_EVENT, lock);
    return () => window.removeEventListener(LOCKED_EVENT, lock);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <main className="mx-auto w-full max-w-md">
          <ScreenTransition>
            {(location) => (
              <Routes location={location}>
                <Route path="/" element={<CategoriesPage />} />
                <Route path="/categories/:id" element={<CategoryDetailPage />} />
                <Route
                  path="/categories/:id/history"
                  element={<CategoryHistoryPage />}
                />
                <Route path="/log-activity" element={<LogActivityPage />} />
                <Route path="/missions" element={<MissionsPage />} />
                <Route path="/lair" element={<LairPage />} />
                <Route
                  path="*"
                  element={
                    <div className="px-5 pt-16 pb-32">
                      <h1 className="m-0 text-[28px] font-semibold">
                        Aquí no hay nada
                      </h1>
                      <p className="mt-2 text-[15px] text-ink-soft">
                        Esta dirección no lleva a ninguna pantalla.
                      </p>
                      <Link to="/" className="btn mt-8">
                        Volver al inicio
                      </Link>
                    </div>
                  }
                />
              </Routes>
            )}
          </ScreenTransition>
        </main>

        <BottomNav />
        {locked && <UnlockScreen />}
        <UpdateBanner />
      </div>
    </BrowserRouter>
  );
}

export default App;
