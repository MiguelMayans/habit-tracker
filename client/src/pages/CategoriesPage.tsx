import { useCallback, useEffect, useState } from "react";
import {
  getCategories,
  getRecentActivities,
  type Category,
  type RecentActivity,
} from "../api/client";
import { calculateStreak, calendarParts, isToday } from "../lib/dates";
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

  const today = calendarParts(new Date());
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
          {/* The date the way Persona shows it: the day huge, and the
              weekday and month stacked beside it. It used to be one
              sentence-case line — "24 de Septiembre de 2026" — the only
              lowercase text in the app, and set like a form field. The year
              went: nobody needs telling which one it is. */}
          <p className="anim-ribbon m-0 flex items-center gap-2.5">
            <b className="text-sign font-figure text-[46px] leading-[0.8] text-bone">
              {today.day}
            </b>
            <span className="grid justify-items-start gap-1">
              <span
                className="bg-yellow px-2 py-0.5 font-display text-[12px] leading-tight text-black"
                style={{ transform: "rotate(-3deg) skewX(-10deg)" }}
              >
                <span
                  className="inline-block"
                  style={{ transform: "skewX(10deg)" }}
                >
                  {today.weekday}
                </span>
              </span>
              <span className="text-outline text-[10px] font-bold tracking-[0.22em] text-bone">
                {today.month}
              </span>
            </span>
          </p>

          {fromToday.length > 0 && (
            <span
              className="anim-ribbon inline-block bg-yellow px-3 py-1 font-display text-[13px] text-black"
              style={{
                transform: "rotate(-1.5deg) skewX(-10deg)",
                boxShadow: "4px 4px 0 var(--color-black)",
              }}
            >
              {/* What today is worth, not how many rows it took: "HOY · 3"
                  read as a count of nothing in particular, and the strip
                  below already answers it when you tap today. */}
              <span className="inline-block" style={{ transform: "skewX(10deg)" }}>
                +{todayXp} XP HOY
              </span>
            </span>
          )}
        </div>
      </header>

      <RhythmStrip activities={recent} streak={streak} />

      {/* A slightly larger gap than usual: the level spills over the top. */}
      <ul className="grid gap-6">
        {categories.map((c, i) => (
          <CategoryCard key={c.id} category={c} index={i} onLogged={load} />
        ))}
      </ul>
    </div>
  );
}
