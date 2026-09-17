import { useState } from "react";
import { Link } from "react-router-dom";
import { getFocusesByCategory, type Category, type Focus } from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { sinceLastActivity } from "../lib/dates";
import { CategoryIcon } from "./CategoryIcon";
import { categoryWordmark } from "../lib/categoryWordmark";

/** Alternating tilt and offset per card, for the collage effect. */
const TILTS = ["-1.2deg", "0.8deg", "-0.6deg", "1.1deg", "-0.9deg"];
const OFFSETS = ["0px", "10px", "0px", "12px", "0px"];

/**
 * A category on the home screen, with its focuses collapsible inside it.
 *
 * The link to the detail does NOT wrap the whole card, as it used to: the
 * disclosure bar is a button, and a button inside a link is not valid HTML —
 * the browser un-nests it and the result depends on which browser you are in.
 * So the link covers the title band and the stats, while the bar and the
 * focus panel are its siblings inside the same card clip.
 *
 * The price: the level and the wordmark, which are overlaid outside the clip,
 * stop being part of that link area. The wordmark carries its own link; the
 * level does not, because it is a fact rather than a destination.
 */
export function CategoryCard({
  category: c,
  index: i,
}: {
  category: Category;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focuses, setFocuses] = useState<Focus[] | null>(null);
  const [loadingFocuses, setLoadingFocuses] = useState(false);
  const [focusesError, setFocusesError] = useState<string | null>(null);

  const accent = categoryColorVar(c.slug);
  const last = sinceLastActivity(c.lastActivityAt);
  const wordmark = categoryWordmark(c.slug);
  const panelId = `category-focuses-${c.id}`;

  function loadFocuses() {
    setLoadingFocuses(true);
    setFocusesError(null);
    getFocusesByCategory(c.id)
      .then(setFocuses)
      .catch((e: Error) => setFocusesError(e.message))
      .finally(() => setLoadingFocuses(false));
  }

  // Focuses are fetched the first time you open, not when the home loads:
  // there are five categories and the normal case is opening one, not five.
  function onToggle() {
    const next = !isOpen;
    setIsOpen(next);
    if (next && focuses === null && !loadingFocuses) loadFocuses();
  }

  return (
    <li
      className="category-card anim-card relative"
      style={
        {
          "--rotation": TILTS[i % TILTS.length],
          "--delay": `${0.16 + i * 0.07}s`,
          marginLeft: OFFSETS[i % OFFSETS.length],
        } as React.CSSProperties
      }
    >
      {/* The level lives OUTSIDE the clipped layer, which is how it can spill
          over the top of the card.

          `pointer-events-none` because, sitting in front, it was swallowing
          taps on the slice of band it covers and creating a dead zone. It does
          not become a link the way the wordmark does: it is a fact, and two
          links to the same place inside one card are already plenty. */}
      <span className="slam-content pointer-events-none absolute -top-4 right-4 z-20 flex items-baseline gap-1.5">
        <span className="text-outline text-[9px] font-bold tracking-[0.24em] text-bone">
          NIVEL
        </span>
        {/* The level is the reward, so it takes the system yellow and the
            wordmark's lettering treatment. */}
        <b className="text-sign font-display text-[46px] leading-[0.82] text-yellow">
          {c.level}
        </b>
      </span>

      {wordmark && (
        // Outside the clipped layer, same as the level: that is how it spills
        // over the band without the card cutting it off or the band growing
        // taller. It is shifted left so that, as it grows, the right edge
        // barely moves and does not slide under the level.
        //
        // It carries its own link, a sibling of the card's rather than nested
        // inside it: sitting in front, it was swallowing taps, and the
        // category name — the thing that most invites a tap — led nowhere.
        // It is also the only place that name exists as text, because with a
        // wordmark the band does not spell it out: without this link, the
        // card's own link would announce itself with nothing but figures.
        <h2 className="slam-content absolute -top-7 left-0 z-20 m-0">
          <Link to={`/categories/${c.id}`} className="block">
            <img
              src={wordmark.src}
              alt={c.name}
              width={wordmark.width}
              height={wordmark.height}
              className="h-[98px] w-auto max-w-none"
            />
          </Link>
        </h2>
      )}

      <div
        className="card-clip bg-black"
        style={{
          // The hard shadow takes the category colour: on a black background a
          // black shadow would be invisible, and this way it adds colour to
          // the composition.
          filter: `drop-shadow(11px 11px 0 ${accent})`,
        }}
      >
        <Link to={`/categories/${c.id}`} className="block">
          {/* Colour band. It reserves room on the right for the level, which
              is overlaid from outside this layer. Fixed height, so the band
              measures the same across all five categories, wordmark or not. */}
          <div
            className="relative h-[50px] pr-24 pl-3.5"
            style={{ background: accent }}
          >
            {/* With a wordmark there is no icon as well: the image already has
                its own symbol drawn into it. */}
            {!wordmark && (
              <div className="slam-content flex h-full items-center gap-2.5">
                <CategoryIcon
                  slug={c.slug}
                  strokeWidth={2.4}
                  className="h-[26px] w-[26px] shrink-0 text-black"
                />
                <h2 className="text-sign-fine m-0 font-display text-[22px] leading-none text-bone uppercase">
                  {c.name}
                </h2>
              </div>
            )}
          </div>

          {/* Black zone: the figures read better and the yellow comes back. */}
          <div className="relative px-3.5 pt-3 pb-2">
            <div className="slam-content relative z-10">
              <div className="xp-bar relative h-4 overflow-hidden bg-[#242424]">
                <div
                  className="xp-bar-fill relative h-full bg-yellow"
                  style={
                    {
                      width: `${Math.round(c.progress * 100)}%`,
                      "--delay": `${0.38 + i * 0.07}s`,
                    } as React.CSSProperties
                  }
                />
              </div>

              <div className="mt-2.5 flex items-center gap-2 text-[10px] font-semibold tracking-[0.06em] text-bone/75">
                <span>{c.currentXp} XP</span>
                <i className="h-[3px] w-[3px] rotate-45 bg-bone/55" />
                <span>
                  {c.atMaxLevel ? (
                    <b className="text-yellow">NIVEL MÁXIMO</b>
                  ) : (
                    <>
                      <b className="text-yellow">{c.xpToNextLevel}</b> AL NV{" "}
                      {c.level + 1}
                    </>
                  )}
                </span>
                <i className="h-[3px] w-[3px] rotate-45 bg-bone/55" />
                <span className={last.cold ? "text-cuerpo" : undefined}>
                  {last.text}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Neither its own band nor a different background: the first version
            stacked three dark rectangles — bar, panel and a box per focus —
            and the card turned into a slab. Here the control is one more line
            of the same micro-typography as the stats above, and the only thing
            saying it can be touched is the triangle in the category colour. */}
        {c.focusCount === 0 ? (
          // A category with no focuses would spend this line on a dead label.
          // In its place, a shortcut to the only thing you can do there.
          <Link to={`/categories/${c.id}`} className="block px-3.5 pt-1.5 pb-3.5">
            <span className="slam-content block text-[9.5px] font-bold tracking-[0.16em] text-bone/30">
              SIN FOCOS ·{" "}
              <span style={{ color: accent }}>AÑADIR EL PRIMERO</span>
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls={panelId}
            className="block w-full px-3.5 pt-1.5 pb-3.5 text-left"
          >
            <span className="slam-content flex items-center gap-2 text-[9.5px] font-bold tracking-[0.16em] text-bone/55">
              <i
                className="disclosure-arrow shrink-0"
                data-open={isOpen}
                style={{ color: accent }}
              />
              {c.focusCount} {c.focusCount === 1 ? "FOCO" : "FOCOS"}
            </span>
          </button>
        )}

        {isOpen && (
          <div id={panelId} className="px-3.5 pb-3.5">
            <div className="slam-content">
              {loadingFocuses && (
                <div className="grid gap-2.5" aria-label="Cargando focos">
                  <div className="skeleton h-3 w-2/3" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              )}

              {focusesError && (
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="m-0 text-[10px] font-bold text-cuerpo">
                    {focusesError}
                  </p>
                  <button
                    type="button"
                    onClick={loadFocuses}
                    className="text-[9.5px] font-bold tracking-[0.14em] text-bone/60 underline"
                  >
                    REINTENTAR
                  </button>
                </div>
              )}

              {focuses && !loadingFocuses && !focusesError && (
                // A single rule in the category colour for the whole list,
                // instead of a border per focus: it groups just as well and
                // draws one stroke where there used to be five. With 20px
                // between focuses the rule is enough to keep the list reading
                // as one block.
                <ul
                  className="grid gap-5 border-l-2 pl-3.5"
                  style={{ borderColor: accent }}
                >
                  {focuses.map((f, j) => (
                    <HomeFocusRow
                      key={f.id}
                      focus={f}
                      categoryId={c.id}
                      accent={accent}
                      isChild={f.parentFocusId !== null}
                      delay={j * 0.05}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * A focus inside the disclosure panel. Tapping it logs activity against that
 * focus directly, which is what makes opening the panel worth it: one tap
 * instead of three.
 *
 * A frozen focus is not linked: it is at the maximum level and the backend
 * would reject the activity. Spawning its child still happens from the
 * category detail, which is where that form lives.
 */
function HomeFocusRow({
  focus: f,
  categoryId,
  accent,
  isChild,
  delay,
}: {
  focus: Focus;
  categoryId: number;
  accent: string;
  isChild: boolean;
  delay: number;
}) {
  const content = (
    <>
      <div className="flex items-baseline gap-2">
        {isChild && (
          <span className="shrink-0 text-[9px] leading-none text-bone/30">↳</span>
        )}
        <span className="truncate font-display text-[13px] leading-none text-bone uppercase">
          {f.name}
        </span>
        {/* A frozen focus takes no activity, so instead of the level it says
            why: mastery if it hit the ceiling, closed if you called it done. */}
        {f.atMaxLevel || f.frozen ? (
          <span
            className={`ml-auto shrink-0 text-[9px] font-bold tracking-[0.14em] ${
              f.atMaxLevel ? "text-yellow" : "text-bone/35"
            }`}
          >
            {f.atMaxLevel ? "MAESTRÍA" : "CERRADO"}
          </span>
        ) : (
          // The figure in display type and in the category colour: it is the
          // only thing giving the row a hierarchy, and at 9px in grey it was
          // not doing that. Yellow stays reserved for the category level above
          // and for XP, so a glance tells the focus level apart from its
          // category's without reading the label.
          <span className="ml-auto flex shrink-0 items-baseline gap-1">
            <span className="text-[8px] font-bold tracking-[0.18em] text-bone/35">
              NV
            </span>
            <b
              className="font-display text-[13px] leading-none"
              style={{ color: accent }}
            >
              {f.level}
            </b>
          </span>
        )}
      </div>

      {/* A hairline instead of the full bar: here progress is glanced at, not
          consulted. The category detail still has the complete one. It carries
          the same diagonal cut as the big bar — a flat rectangle was the only
          thing on the card neither skewed nor cut — and sits at 3px, because
          at 2 the cut was not visible. */}
      <div className="xp-bar mt-2 h-[3px] overflow-hidden bg-bone/12">
        <div
          className="h-full"
          style={{
            width: `${Math.round(f.progress * 100)}%`,
            background: f.frozen ? accent : "var(--color-yellow)",
          }}
        />
      </div>
    </>
  );

  return (
    <li
      className={`anim-row ${isChild ? "pl-3" : ""}`}
      style={{ "--delay": `${delay}s` } as React.CSSProperties}
    >
      {f.frozen ? (
        <div>{content}</div>
      ) : (
        <Link
          to={`/log-activity?category=${categoryId}&focus=${f.id}`}
          className="block"
        >
          {content}
        </Link>
      )}
    </li>
  );
}
