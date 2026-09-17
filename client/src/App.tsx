import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CategoryDetailPage } from "./pages/CategoryDetailPage";
import { CategoryHistoryPage } from "./pages/CategoryHistoryPage";
import { LogActivityPage } from "./pages/LogActivityPage";
import { LogFab } from "./components/LogFab";

/**
 * The dust motes in the beam: positions in pixels, always multiples of 7 —
 * the halftone's step — so each one lands exactly on a grid dot rather than
 * between two.
 *
 * They are spread along the cone as it falls on a phone. On screens where one
 * ends up outside the beam, the clip-path crops it and it simply is not
 * painted: there is nothing to recompute.
 *
 * Cycles and delays share no common multiples, so the pattern never repeats.
 * There are 18: any fewer and they get lost in the noise of the halftone and
 * never read as anything.
 */
const MOTES = [
  { x: 28, y: 63, cycle: "5.3s", delay: "0s" },
  { x: 84, y: 119, cycle: "7.1s", delay: "3.4s" },
  { x: 133, y: 168, cycle: "6.2s", delay: "1.9s" },
  { x: 21, y: 217, cycle: "8.3s", delay: "5.6s" },
  { x: 91, y: 266, cycle: "5.9s", delay: "2.7s" },
  { x: 189, y: 273, cycle: "7.7s", delay: "6.8s" },
  { x: 56, y: 322, cycle: "6.6s", delay: "0.8s" },
  { x: 147, y: 371, cycle: "9.1s", delay: "4.3s" },
  { x: 238, y: 378, cycle: "5.4s", delay: "7.2s" },
  { x: 105, y: 427, cycle: "7.4s", delay: "1.1s" },
  { x: 196, y: 476, cycle: "6.9s", delay: "5.1s" },
  { x: 70, y: 525, cycle: "8.7s", delay: "2.2s" },
  { x: 273, y: 532, cycle: "5.7s", delay: "6.3s" },
  { x: 161, y: 574, cycle: "7.9s", delay: "3.8s" },
  { x: 224, y: 623, cycle: "6.3s", delay: "8.1s" },
  { x: 119, y: 630, cycle: "8.1s", delay: "0.4s" },
  { x: 301, y: 665, cycle: "5.6s", delay: "4.9s" },
  { x: 182, y: 700, cycle: "7.2s", delay: "7.6s" },
];

function App() {
  return (
    <BrowserRouter>
      {/* The scene lives in the layout, not in each screen. Five fixed layers,
          all behind the content and none of them capturing the pointer: the
          room, the light beam with its halftone inside, the table, the grain
          and the vignette. */}
      <div className="relative min-h-screen overflow-hidden bg-black">
        <div className="scene scene-room" />
        <div className="scene scene-beam">
          {MOTES.map((m) => (
            <span
              key={`${m.x}-${m.y}`}
              className="mote"
              style={
                {
                  left: m.x,
                  top: m.y,
                  "--cycle": m.cycle,
                  "--delay": m.delay,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className="scene scene-table" />
        <div className="scene scene-grain" />
        <div className="scene scene-vignette" />

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
