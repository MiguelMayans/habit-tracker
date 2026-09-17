import { useCallback, useEffect, useState } from "react";
import {
  getCategories,
  getRecentActivities,
  type Category,
  type RecentActivity,
} from "../api/client";
import { calculateStreak, isToday, longDate } from "../lib/dates";
import { XP_BY_INTENSITY } from "../lib/intensity";
import { CategoryCard } from "../components/CategoryCard";
import { RhythmStrip } from "../components/RhythmStrip";
import { SkeletonCards } from "../components/SkeletonCards";
import { ErrorPanel } from "../components/ErrorPanel";
import logo from "../assets/logo.png";

// Enough for a streak of months: a streak breaks the moment a day is missing,
// so fetching more would only serve unrealistically long ones.
const RECENT_LIMIT = 300;

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recent, setRecent] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([getCategories(), getRecentActivities({ limit: RECENT_LIMIT })])
      .then(([cats, acts]) => {
        setCategories(cats);
        setRecent(acts);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Resetting loading/error lives in the event that causes it (the button) and
  // not inside the effect: that way a synchronous setState does not trigger a
  // second cascading render while React is syncing the effect.
  function onRetry() {
    setLoading(true);
    setError(null);
    load();
  }

  const streak = calculateStreak(recent.map((a) => a.date));
  const fromToday = recent.filter((a) => isToday(a.date));
  const todayXp = fromToday.reduce(
    (sum, a) => sum + XP_BY_INTENSITY[a.intensity],
    0,
  );

  if (loading)
    return (
      <div className="px-4 pt-8 pb-32">
        <SkeletonCards n={5} />
      </div>
    );
  if (error)
    return (
      <div className="px-4 pt-8 pb-32">
        <ErrorPanel message={error} onRetry={onRetry} />
      </div>
    );

  return (
    <div className="px-4 pt-8 pb-32">
      <header className="relative mb-10 px-1">
        {/* The wordmark replaces a typographic title. Fluid width with a cap,
            so on a phone it takes the space available and does not overgrow on
            large screens. width/height prevent the layout jump while loading.

            The band sits loose in the header, not inside the h1: it has to
            overflow the container's width to reach both edges. */}
        <div className="bleed-band anim-logo top-[-16px] z-0 h-[128px]" />

        <h1 className="relative z-10 m-0 w-full max-w-[340px]">
          <img
            src={logo}
            alt="Mike's Life"
            width={800}
            height={325}
            className="anim-logo block h-auto w-full"
          />
        </h1>
        {/* relative + z-10: the paper shapes in the logo are positioned and,
            without this, they paint over the ribbons and cover them.

            The two ribbons share a row and push to opposite ends rather than
            stacking: stacked they sat flush against each other and read as one
            yellow block. `flex-wrap` puts them back on two lines if they do
            not fit. */}
        <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
          <p
            className="anim-ribbon m-0 inline-block bg-yellow px-4 py-1.5 text-[12px] font-bold tracking-[0.18em] text-black"
            style={{
              transform: "rotate(-2.5deg) skewX(-10deg)",
              boxShadow: "4px 4px 0 var(--color-black)",
            }}
          >
            <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
              {longDate(new Date())}
            </span>
          </p>

          {fromToday.length > 0 && (
            <span
              className="anim-ribbon inline-block bg-yellow px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-black"
              style={{
                transform: "rotate(-1.5deg) skewX(-10deg)",
                boxShadow: "3px 3px 0 var(--color-black)",
              }}
            >
              <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
                HOY · {fromToday.length} · +{todayXp} XP
              </span>
            </span>
          )}
        </div>
      </header>

      <RhythmStrip activities={recent} streak={streak} />

      {/* A slightly larger gap than usual: the level spills over the top. */}
      <ul className="grid gap-6">
        {categories.map((c, i) => (
          <CategoryCard key={c.id} category={c} index={i} />
        ))}
      </ul>
    </div>
  );
}
