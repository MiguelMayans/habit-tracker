import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CategoryDetailPage } from "./pages/CategoryDetailPage";
import { CategoryHistoryPage } from "./pages/CategoryHistoryPage";
import { LogActivityPage } from "./pages/LogActivityPage";
import { LogFab } from "./components/LogFab";

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
  return (
    <BrowserRouter>
      {/* The scene lives in the layout, not in each screen. Every layer is
          fixed, behind the content, and none of them captures the pointer:
          the rays, the screentone that dissolves them, the stars
          and the grain. */}
      <div className="relative min-h-screen overflow-hidden bg-black">
        <div className="scene scene-burst" />
        <div className="scene">
          <div className="tone tone-1" />
          <div className="tone tone-2" />
          <div className="tone tone-3" />
          <div className="tone tone-4" />
          <div className="tone tone-floor" />
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
          <Routes>
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
                <p className="px-6 py-10 text-bone/60">Página no encontrada</p>
              }
            />
          </Routes>
        </main>

        <LogFab />
      </div>
    </BrowserRouter>
  );
}

export default App;
