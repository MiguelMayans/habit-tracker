import type { Mission } from "../api/client";
import { isToday } from "../lib/dates";
import { missionGroup } from "../lib/missions";
import { useCountUp } from "../lib/useCountUp";
import { Confetti } from "./Confetti";

/**
 * The missions' pulse for today: a terracotta ring that closes as today's
 * errands get done, with the count beside it and a line that changes with
 * how the day is going. "Today" is what is due today or already late, plus
 * whatever you ticked off today.
 *
 * Clearing the day is the one moment this screen celebrates: a soft
 * confetti, once.
 */
export function DayPulse({
  missions,
  justCleared,
}: {
  missions: Mission[];
  /** True right after the last of today's was ticked: plays the confetti. */
  justCleared: boolean;
}) {
  const left = missions.filter((m) => {
    const g = missionGroup(m);
    return g === "today" || g === "overdue";
  }).length;
  const doneToday = missions.filter(
    (m) => m.completedAt !== null && isToday(m.completedAt),
  ).length;
  const total = left + doneToday;
  const shownDone = useCountUp(doneToday, 600);

  const size = 76;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const length = 2 * Math.PI * r;
  const ratio = total === 0 ? 1 : doneToday / total;

  const line =
    total === 0
      ? "Nada urgente hoy. Lo demás puede esperar."
      : left === 0
        ? "Día despejado."
        : doneToday === 0
          ? left === 1
            ? "Una cosa para hoy. Sin prisa."
            : `${left} cosas para hoy. Una detrás de otra.`
          : left === 1
            ? "Te queda una."
            : `Te quedan ${left}.`;

  return (
    <section className="settle relative mb-8 flex items-center gap-5">
      {justCleared && <Confetti />}
      <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="color-mix(in oklab, var(--color-cuerpo) 16%, transparent)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-cuerpo)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={length}
            strokeDashoffset={length * (1 - ratio)}
            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.2, 0.7, 0.2, 1)" }}
          />
        </svg>
        {total === 0 || left === 0 ? (
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-cuerpo" aria-hidden="true">
            <path d="m5.5 12.5 4 4 9-10" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span className="display text-[24px] leading-none">
            {shownDone}
            <span className="text-[14px] text-ink-faint">/{total}</span>
          </span>
        )}
      </span>
      <div>
        <p className="m-0 text-[12px] font-semibold tracking-[0.14em] text-ink-faint uppercase">
          Hoy
        </p>
        <p className="display mt-1 mb-0 text-[21px] leading-snug">{line}</p>
      </div>
    </section>
  );
}
