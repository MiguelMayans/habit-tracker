import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/** The way back, at the top of every inner screen. */
export function BackLink({ to = "/", label = "Inicio" }: { to?: string; label?: string }) {
  return (
    <Link
      to={to}
      className="settle -ml-1 inline-flex items-center gap-1 py-1 text-[15px] font-medium text-ink-soft"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="m15 6-6 6 6 6" />
      </svg>
      {label}
    </Link>
  );
}

/** A section's heading inside a screen: small, soft, out of the way. */
export function SectionTitle({
  children,
  className = "",
  count,
}: {
  children: ReactNode;
  className?: string;
  count?: number;
}) {
  return (
    <h2 className={`settle mt-0 mb-3 flex items-baseline gap-2 text-[15px] font-semibold ${className}`}>
      {children}
      {count !== undefined && (
        <span className="text-[14px] font-normal text-ink-faint">{count}</span>
      )}
    </h2>
  );
}
