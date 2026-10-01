/**
 * The hit of earning XP, drawn where you tapped.
 *
 * It is plain DOM and the Web Animations API rather than React state: the
 * effect outlives the chip that caused it (the chips unmount the moment the
 * log lands), it needs no re-render of anything, and it cleans itself up.
 *
 * Three things happen at once:
 * - a diamond shockwave and a crown of spikes burst from the tap — comic
 *   impact lines, angular like the rest of the app, never a soft circle;
 * - the card the tap came from takes the blow and jolts;
 * - an `xp-impact` event goes out, and the backdrop's rays flare in answer
 *   (see App.tsx): the world reacts to what you just did.
 */

const SPIKES = 12;

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Where the tap was, read BEFORE the request: the chip will be gone after. */
export function impactOrigin(el: Element): {
  x: number;
  y: number;
  color: string;
  card: Element | null;
} {
  const r = el.getBoundingClientRect();
  const color =
    getComputedStyle(el).getPropertyValue("--accent").trim() ||
    "var(--color-cuerpo)";
  return {
    x: r.left + r.width / 2,
    y: r.top + r.height / 2,
    color,
    card: el.closest(".category-card"),
  };
}

export function impactAt(origin: ReturnType<typeof impactOrigin>) {
  window.dispatchEvent(new CustomEvent("xp-impact"));
  if (reducedMotion()) return;

  const root = document.createElement("div");
  root.className = "impact";
  root.style.left = `${origin.x}px`;
  root.style.top = `${origin.y}px`;
  root.style.setProperty("--impact", origin.color);

  const ring = document.createElement("i");
  ring.className = "impact-ring";
  root.appendChild(ring);

  for (let i = 0; i < SPIKES; i++) {
    const spike = document.createElement("i");
    spike.className = "impact-spike";
    // Uneven angles and reach, for the same reason the rays are uneven.
    const angle = (360 / SPIKES) * i + ((i * 37) % 11) - 5;
    spike.style.setProperty("--angle", `${angle}deg`);
    spike.style.setProperty("--reach", `${52 + ((i * 29) % 34)}px`);
    root.appendChild(spike);
  }

  document.body.appendChild(root);
  window.setTimeout(() => root.remove(), 700);

  // `translate`, not `transform`: the cards carry their own rotate and skew
  // in `transform`, and the individual property composes with it.
  origin.card?.animate(
    [
      { translate: "0 0" },
      { translate: "-5px 4px" },
      { translate: "4px -3px" },
      { translate: "-2px 1px" },
      { translate: "0 0" },
    ],
    { duration: 300, easing: "steps(4)" },
  );
}
