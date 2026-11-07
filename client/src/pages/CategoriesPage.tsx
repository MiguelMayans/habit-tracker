import { useCallback, useEffect, useState } from "react";
import {
  getCategories,
  getRecentActivities,
  type Category,
  type RecentActivity,
} from "../api/client";
import { calculateStreak, isToday, longDate } from "../lib/dates";
import { greeting } from "../lib/daypart";
import { XP_BY_INTENSITY } from "../lib/intensity";
import { CategoryCard } from "../components/CategoryCard";
import { RhythmStrip } from "../components/RhythmStrip";
import { SkeletonCards } from "../components/SkeletonCards";
import { ErrorPanel } from "../components/ErrorPanel";
import { SoundToggle } from "../components/SoundToggle";
import { DaypartMark } from "../components/DaypartMark";

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

  const now = new Date();
  const streak = calculateStreak(recent.map((a) => a.date));
  const fromToday = recent.filter((a) => isToday(a.date));
  const todayXp = fromToday.reduce(
    (sum, a) => sum + XP_BY_INTENSITY[a.intensity],
    0,
  );

  if (loading)
    return (
      <div className="px-5 pt-14 pb-32">
        <div className="skeleton mb-8 h-40" />
        <SkeletonCards n={4} />
      </div>
    );
  if (error)
    return (
      <div className="px-5 pt-14 pb-32">
        <ErrorPanel message={error} onRetry={onRetry} />
      </div>
    );

  return (
    <div className="px-5 pt-10 pb-32">
      <header className="settle mb-7">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow m-0">{longDate(now)}</p>
          <SoundToggle />
        </div>
        {/* A line said to you, not a dashboard title — the way Claude greets
            you on its home. */}
        <h1 className="display mt-3 mb-0 flex items-start gap-3 text-[34px] leading-[1.1]">
          <DaypartMark className="mt-1 h-8 w-8" />
          <span>{greeting(now)}</span>
        </h1>
      </header>

      <RhythmStrip activities={recent} streak={streak} todayXp={todayXp} />

      <ul className="m-0 grid list-none gap-4 p-0">
        {categories.map((c, i) => (
          <CategoryCard key={c.id} category={c} index={i} onLogged={load} />
        ))}
      </ul>
    </div>
  );
}
