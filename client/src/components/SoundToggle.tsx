import { useState } from "react";
import { isSoundOn, playSound, setSoundOn } from "../lib/sound";

/**
 * Sound on or off, top right of the home. Remembered on this device only:
 * whether the phone should make noise is a question about where you are, not
 * about your data.
 */
export function SoundToggle() {
  const [on, setOn] = useState(isSoundOn);

  function toggle() {
    const next = !on;
    setSoundOn(next);
    setOn(next);
    // Turning it on answers with a sound, so you know it worked.
    if (next) playSound("hit");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Silenciar sonidos" : "Activar sonidos"}
      className="sound-toggle anim-ribbon"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
        aria-hidden="true"
      >
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="currentColor" />
        {on ? (
          <>
            <path d="M15.5 9a4 4 0 0 1 0 6" />
            <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
          </>
        ) : (
          <path d="m16 9.5 5 5m0-5-5 5" />
        )}
      </svg>
    </button>
  );
}
