import { Link, useLocation } from "react-router-dom";

/**
 * The action that persists across every screen (docs/DESIGN.md). It hides on
 * the logging screen itself, where it no longer leads anywhere.
 *
 * It carries context along: from inside a category, the logging screen opens
 * with that category already chosen instead of making you pick it again.
 */
export function LogFab() {
  const { pathname } = useLocation();
  if (pathname === "/log-activity") return null;

  const inCategory = pathname.match(/^\/categories\/(\d+)$/);
  const target = inCategory
    ? `/log-activity?category=${inCategory[1]}`
    : "/log-activity";

  return (
    // No fixed width: the pill is sized by its label. Hard-coding one would
    // mean eyeballing it again every time the text or the type size changes.
    <Link
      to={target}
      className="anim-fab fixed right-5 bottom-6 z-40 flex h-12 items-center justify-center px-7"
      style={{ transform: "skewX(-10deg)" }}
    >
      {/* The clip lives on this layer and not on the link, because
          `clip-path` also clips the `box-shadow` — and that is what beats. */}
      <div className="pill-cut absolute inset-0 bg-yellow" />

      {/* Counter-skewed: the pill sits at an angle, the label reads level. */}
      <span
        className="relative flex items-baseline gap-1.5 font-display text-[14px] leading-none text-black uppercase"
        style={{ transform: "skewX(10deg)" }}
      >
        <b className="text-[18px] leading-none">+</b>
        Registrar
      </span>
    </Link>
  );
}
