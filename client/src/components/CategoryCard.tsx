import { useState } from "react";
import { Link } from "react-router-dom";
import {
  createActivity,
  deleteActivity,
  getFocusesByCategory,
  type Category,
  type Focus,
  type Intensity,
  type RegisterActivityResult,
} from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { sinceLastActivity } from "../lib/dates";
import { XP_BY_INTENSITY } from "../lib/intensity";
import { CategoryIcon } from "./CategoryIcon";
import { ResultModal } from "./ResultModal";
import { categoryWordmark } from "../lib/categoryWordmark";

/** The three intensities, in the order they cost. */
const INTENSITIES: { value: Intensity; label: string }[] = [
  { value: "chispa", label: "Chispa" },
  { value: "impulso", label: "Impulso" },
  { value: "all_out", label: "All-Out" },
];

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
  onLogged,
}: {
  category: Category;
  index: number;
  /** Refreshes the home's data after logging from inside the card. */
  onLogged: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focuses, setFocuses] = useState<Focus[] | null>(null);
  const [loadingFocuses, setLoadingFocuses] = useState(false);
  const [focusesError, setFocusesError] = useState<string | null>(null);

  // Quick logging: which row has its intensities open, and the result when
  // the log earns a full-screen celebration.
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterActivityResult | null>(null);

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
    setOpenRow(null);
    if (next && focuses === null && !loadingFocuses) loadFocuses();
  }

  /**
   * Logs straight from the card: two taps and no navigation.
   *
   * The description is left empty on purpose. It is optional by design — what
   * counts is that it happened and at what intensity — and a form is exactly
   * what this path exists to avoid. The full screen is still one tap away
   * behind "CON NOTA", for when you do want to write something or backdate it.
   */
  async function onQuickLog(focusId: number, intensity: Intensity) {
    setLogError(null);
    setLogging(true);

    try {
      const res = await createActivity({
        categoryId: c.id,
        focusId,
        intensity,
      });
      setOpenRow(null);

      // The celebration is spent only where it is earned. It used to fire on
      // every single log, including a routine +10 that changes nothing, and a
      // celebration that always happens stops being one.
      if (res.focus?.leveledUp || res.category.leveledUp) setResult(res);

      loadFocuses();
      onLogged();
    } catch (e) {
      setLogError((e as Error).message);
    } finally {
      setLogging(false);
    }
  }

  async function onUndoQuickLog() {
    if (!result) return;
    await deleteActivity(result.activity.id);
    loadFocuses();
    onLogged();
  }

  return (
    <li
      className="category-card anim-card relative"
      style={
        {
          "--rotation": TILTS[i % TILTS.length],
          "--delay": `${0.16 + i * 0.07}s`,
          "--accent": accent,
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

        {/* Still no band of its own and no separate background: the first
            version stacked three dark rectangles — bar, panel and a box per
            focus — and the card turned into a slab. What changed is that the
            control is no longer a line of text with an arrow beside it: it is
            the head of the bracket the list hangs from. */}
        {c.focusCount === 0 ? (
          // A category with no focuses would spend this line on a dead label.
          // In its place, the same tab drawn as an empty slot, leading to the
          // only thing you can do there.
          <Link
            to={`/categories/${c.id}`}
            className="block px-3.5 pt-2 pb-4"
            aria-label={`${c.name}: añadir el primer foco`}
          >
            <span className="slam-content inline-block">
              <span className="focus-tab focus-tab-empty">
                <span>
                  <b className="font-display text-[15px] leading-none">+</b>
                  <span className="text-[8px] font-bold tracking-[0.2em]">
                    PRIMER FOCO
                  </span>
                </span>
              </span>
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls={panelId}
            // Abierto, el hueco de abajo se cierra: el tallo tiene que nacer
            // pegado a la pestaña o dejan de leerse como una sola pieza.
            className={`block px-3.5 pt-2 text-left ${isOpen ? "pb-0" : "pb-4"}`}
          >
            <span className="slam-content inline-block">
              <span className="focus-tab" data-open={isOpen}>
                <span>
                  <i className="disclosure-arrow shrink-0 self-center" />
                  <b className="font-display text-[15px] leading-none">
                    {c.focusCount}
                  </b>
                  <span className="text-[8px] font-bold tracking-[0.2em]">
                    {c.focusCount === 1 ? "FOCO" : "FOCOS"}
                  </span>
                </span>
              </span>
            </span>
          </button>
        )}

        {isOpen && (
          <div id={panelId} className="px-3.5 pt-2 pb-4">
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

              {logError && (
                <p className="anim-slam mb-3 bg-cuerpo px-2.5 py-1.5 text-[10px] font-bold text-bone">
                  {logError}
                </p>
              )}

              {focuses && !loadingFocuses && !focusesError && (
                // The stem of the bracket whose head is the tab above, with
                // a tick joining each focus to it. One stroke for the whole
                // list instead of a border per focus, and the ticks are what
                // stop that stroke from being decoration.
                <ul className="focus-branch grid gap-5 pl-3.5">
                  {focuses.map((f, j) => (
                    <HomeFocusRow
                      key={f.id}
                      focus={f}
                      categoryId={c.id}
                      accent={accent}
                      isChild={f.parentFocusId !== null}
                      delay={j * 0.05}
                      expanded={openRow === f.id}
                      busy={logging}
                      onExpand={() => {
                        setLogError(null);
                        setOpenRow(openRow === f.id ? null : f.id);
                      }}
                      onPick={(intensity) => onQuickLog(f.id, intensity)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Solo aparece si el registro ha subido un nivel: ver onQuickLog. */}
      {result && (
        <ResultModal
          result={result}
          category={c}
          backTo=""
          onClose={() => setResult(null)}
          onUndo={onUndoQuickLog}
        />
      )}
    </li>
  );
}

/**
 * A focus inside the disclosure panel.
 *
 * Tapping it no longer leaves the home for a form: the row unfolds into its
 * three intensities right here, and picking one logs it. Two taps and no
 * navigation, which is the whole point of having opened the panel.
 *
 * "CON NOTA" keeps the long road one tap away, for when you actually want to
 * write something down or log it with a different date.
 *
 * A frozen focus does not unfold: it is at the maximum level or you called it
 * done, and the backend would reject the activity either way.
 */
function HomeFocusRow({
  focus: f,
  categoryId,
  accent,
  isChild,
  delay,
  expanded,
  busy,
  onExpand,
  onPick,
}: {
  focus: Focus;
  categoryId: number;
  accent: string;
  isChild: boolean;
  delay: number;
  expanded: boolean;
  busy: boolean;
  onExpand: () => void;
  onPick: (intensity: Intensity) => void;
}) {
  const head = (
    <>
      <div className="flex items-baseline gap-2">
        {/* No "↳" any more: the branch is drawn by the longer tick on an
            indented row, so the glyph would be saying it a second time. */}
        <span className="truncate font-display text-[13px] leading-none text-bone uppercase">
          {f.name}
        </span>
        {/* A frozen focus takes no activity, so instead of the level it says
            why: mastery if it hit the ceiling, closed if you called it done. */}
        {f.atMaxLevel || f.frozen ? (
          <span
            className={`ml-auto shrink-0 text-[9px] font-bold tracking-[0.14em] ${
              f.atMaxLevel ? "text-yellow" : "text-bone/50"
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
            <span className="text-[8px] font-bold tracking-[0.18em] text-bone/50">
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
            // The XP arrives without remounting the row, so without this the
            // reward would simply appear instead of being seen to land.
            transition: "width 0.5s cubic-bezier(0.2, 0.9, 0.25, 1)",
          }}
        />
      </div>
    </>
  );

  return (
    <li
      className={`anim-row ${isChild ? "pl-3" : ""}`}
      data-child={isChild}
      style={{ "--delay": `${delay}s` } as React.CSSProperties}
    >
      {f.frozen ? (
        <div>{head}</div>
      ) : (
        <button
          type="button"
          onClick={onExpand}
          aria-expanded={expanded}
          className="block w-full text-left"
        >
          {head}
        </button>
      )}

      {expanded && !f.frozen && (
        <div className="anim-row mt-2.5" style={{ "--delay": "0s" } as React.CSSProperties}>
          <div className="flex gap-2">
            {INTENSITIES.map((i) => (
              <button
                key={i.value}
                type="button"
                disabled={busy}
                onClick={() => onPick(i.value)}
                className="quick-chip"
              >
                <span className="text-[10px] leading-tight">{i.label}</span>
                <span className="mt-0.5 text-[12px] leading-none">
                  +{XP_BY_INTENSITY[i.value]}
                </span>
              </button>
            ))}
          </div>

          <Link
            to={`/log-activity?category=${categoryId}&focus=${f.id}`}
            className="mt-2 inline-block text-[9px] font-bold tracking-[0.16em] text-bone/55 underline"
          >
            CON NOTA U OTRA FECHA
          </Link>
        </div>
      )}
    </li>
  );
}
