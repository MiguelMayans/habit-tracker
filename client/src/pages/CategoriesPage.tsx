import { useCallback, useEffect, useState } from "react";
import {
  getCategories,
  getRecentActivities,
  peek,
  type Category,
  type RecentActivity,
} from "../api/client";
import { calculateStreak, dateParts, isToday } from "../lib/dates";
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
  // Painted from the last answer when there is one: coming back home is
  // instant, and the data refreshes underneath.
  const [categories, setCategories] = useState<Category[]>(
    () => peek<Category[]>("/categories") ?? [],
  );
  const [recent, setRecent] = useState<RecentActivity[]>(
    () => peek<RecentActivity[]>(`/activities?limit=${RECENT_LIMIT}`) ?? [],
  );
  const [loading, setLoading] = useState(() => peek("/categories") === undefined);
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
  const date = dateParts(now);
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
        {/* The masthead: the app's name, small and in italic serif, over a
            hairline with a terracotta dot — a magazine's, not an app bar's. */}
        <div className="flex items-center justify-between gap-4">
          <p className="display m-0 text-[17px] italic tracking-wide text-ink-soft">
            Mike&apos;s Life
          </p>
          <SoundToggle />
        </div>
        <div className="masthead-rule mt-2.5" aria-hidden="true">
          <i />
        </div>

        {/* The date set like a cover line: the day as a big figure, the
            weekday in spaced small capitals beside it and the month in
            italic underneath. */}
        <p className="mt-6 mb-0 flex items-center gap-3.5" aria-label={`${date.weekday}, ${date.day} de ${date.month}`}>
          <span className="display text-[64px] leading-[0.8] font-normal" aria-hidden="true">
            {date.day}
          </span>
          <span className="grid gap-1 border-l border-ink/15 pl-3.5" aria-hidden="true">
            <span className="text-[12px] font-semibold tracking-[0.22em] text-ink uppercase">
              {date.weekday}
            </span>
            <span className="display text-[17px] leading-none text-ink-soft italic">
              {date.month}
            </span>
          </span>
        </p>

        {/* A line said to you, not a dashboard title — the way Claude greets
            you on its home. */}
        <h1 className="display mt-6 mb-0 flex items-start gap-3 text-[30px] leading-[1.12]">
          <DaypartMark className="mt-1 h-7 w-7" />
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
