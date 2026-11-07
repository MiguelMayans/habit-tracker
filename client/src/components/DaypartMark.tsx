import { daypart } from "../lib/daypart";

/**
 * The little mark beside the greeting: a sun by day, a crescent by night, in
 * terracotta. It turns into place when the home opens, and then breathes,
 * very slowly.
 */
export function DaypartMark({ className = "" }: { className?: string }) {
  const part = daypart();
  const night = part === "evening" || part === "night";

  return (
    <span className={`sun-in inline-grid shrink-0 ${className}`} aria-hidden="true">
    <svg viewBox="0 0 32 32" className="sun-breathe h-full w-full text-cuerpo">
      {night ? (
        <path
          d="M20.5 5.5a10.5 10.5 0 1 0 6 18.6A12 12 0 0 1 20.5 5.5Z"
          fill="currentColor"
        />
      ) : (
        <g fill="currentColor">
          <circle cx="16" cy="16" r="5.2" />
          {Array.from({ length: 8 }, (_, i) => (
            <rect
              key={i}
              x="14.6"
              y="1.5"
              width="2.8"
              height="7"
              rx="1.4"
              transform={`rotate(${i * 45} 16 16)`}
            />
          ))}
        </g>
      )}
    </svg>
    </span>
  );
}
