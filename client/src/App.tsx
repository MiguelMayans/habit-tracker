import { useEffect, useRef, useState } from "react";
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
  const burst = useRef<HTMLDivElement>(null);

  // The server rejected the key (see lib/apiKey.ts): ask for it.
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const lock = () => setLocked(true);
    window.addEventListener(LOCKED_EVENT, lock);
    return () => window.removeEventListener(LOCKED_EVENT, lock);
  }, []);

  // The world answers when you earn XP (see lib/impact.ts): the rays flare
  // and swell for an instant. `scale` and `filter` as their own animation, so
  // they compose with the spin and the entrance already running on the layer.
  useEffect(() => {
    function flare() {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;
      burst.current?.animate(
        [
          { filter: "brightness(1)", scale: "1" },
          { filter: "brightness(2.4)", scale: "1.07", offset: 0.15 },
          { filter: "brightness(1)", scale: "1" },
        ],
        { duration: 700, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
      );
    }
    window.addEventListener("xp-impact", flare);
    return () => window.removeEventListener("xp-impact", flare);
  }, []);

  return (
    <BrowserRouter>
      {/* The scene lives in the layout, not in each screen. Every layer is
          fixed, behind the content, and none of them captures the pointer:
          the slab and its streak, the screentone corner and the grain. */}
      <div className="relative min-h-screen overflow-hidden bg-black">
        <div ref={burst} className="scene scene-burst" />
        <div className="scene">
          <div className="tone tone-1" />
          <div className="tone tone-2" />
          <div className="tone tone-3" />
        </div>
        <div className="scene scene-grain" />

        <main className="relative z-10 mx-auto w-full max-w-md">
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
                    <div className="px-4 pt-10 pb-32">
                      <h1 className="text-sign m-0 font-display text-[34px] leading-[0.95] text-bone uppercase">
                        Aquí no hay nada
                      </h1>
                      <p className="on-scene mt-3 w-fit text-[12px] leading-relaxed text-bone/75">
                        Esta dirección no lleva a ninguna pantalla.
                      </p>
                      <Link to="/" className="slam-button mt-6">
                        <span>Volver a categorías</span>
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
