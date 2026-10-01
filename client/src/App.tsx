import { useEffect, useRef } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CategoryDetailPage } from "./pages/CategoryDetailPage";
import { CategoryHistoryPage } from "./pages/CategoryHistoryPage";
import { LogActivityPage } from "./pages/LogActivityPage";
import { LogFab } from "./components/LogFab";
import { ScreenTransition } from "./components/ScreenTransition";

/**
 * The logo's stars, loose in the burst. Positions are percentages of the
 * screen, all inside the top band where the rays are still solid: down in the
 * screentone they would be read as one more dot.
 *
 * Cycles and delays share no common multiples, so two never blink together
 * for long and the sky does not pulse like a sign.
 */
const STARS = [
  { x: "9%", y: "7%", size: 16, tilt: "-12deg", cycle: "5.3s", delay: "0.9s" },
  { x: "88%", y: "4%", size: 12, tilt: "20deg", cycle: "6.7s", delay: "2.6s" },
  { x: "50%", y: "2%", size: 18, tilt: "8deg", cycle: "7.9s", delay: "4.1s" },
  { x: "4%", y: "22%", size: 11, tilt: "-25deg", cycle: "6.1s", delay: "5.7s" },
  { x: "92%", y: "19%", size: 14, tilt: "-6deg", cycle: "8.6s", delay: "1.8s" },
];

function App() {
  const burst = useRef<HTMLDivElement>(null);

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
          the rays, the screentone that dissolves them, the stars
          and the grain. */}
      <div className="relative min-h-screen overflow-hidden bg-black">
        <div ref={burst} className="scene scene-burst" />
        <div className="scene">
          <div className="tone tone-1" />
          <div className="tone tone-2" />
          <div className="tone tone-3" />
        </div>
        <div className="scene">
          {STARS.map((st) => (
            <span
              key={`${st.x}-${st.y}`}
              className="star"
              style={
                {
                  left: st.x,
                  top: st.y,
                  "--size": `${st.size}px`,
                  "--tilt": st.tilt,
                  "--cycle": st.cycle,
                  "--delay": st.delay,
                } as React.CSSProperties
              }
            />
          ))}
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
                <Route
                  path="*"
                  element={
                    <div className="px-4 pt-10 pb-32">
                      <h1 className="text-sign m-0 font-display text-[34px] leading-[0.95] text-bone uppercase">
                        Aquí no hay nada
                      </h1>
                      <p className="mt-3 text-[12px] leading-relaxed text-bone/70">
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

        <LogFab />
      </div>
    </BrowserRouter>
  );
}

export default App;
