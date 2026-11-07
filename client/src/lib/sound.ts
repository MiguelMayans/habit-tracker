import { haptic } from "./haptics";

/**
 * The app's few cues: a tiny vibration, always, and a sound, if turned on.
 * The sounds are synthesised with the Web Audio API.
 *
 * Off by default: this app exists to be a quiet corner, and a phone that
 * chimes uninvited is the opposite. Turned on (the speaker on the home), there
 * are only three, each tied to a moment that matters:
 * - `earn`: earning XP — two soft, close sine notes, like a small bell.
 * - `done`: ticking off a mission or finishing a work — a single low, round
 *   note that settles.
 * - `levelUp`: a level up — three slow rising notes ringing out together.
 * Nothing on ordinary taps or navigation: a sound on every button stops
 * meaning anything.
 *
 * Sine waves only, gentle attacks and long soft tails: nothing percussive.
 * Synthesised rather than shipped as files, so there is nothing to load.
 *
 * Browsers only allow audio after the user has interacted with the page.
 * `armSound` unlocks the context on the first touch, so a sound that fires
 * after a network round trip (when the gesture is long gone) still plays.
 */

const STORAGE_KEY = "mikes-life:sound";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function isSoundOn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Without storage the choice lasts until the page is closed. Fine.
  }
}

function context(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext;
  if (!Ctor) return null;

  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
  return ctx;
}

/** Unlocks audio on the first touch. Call once, at startup. */
export function armSound() {
  const unlock = () => {
    if (isSoundOn()) void context()?.resume();
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
}

/** A soft sine note: a gentle attack and a long exponential tail. */
function bell(c: AudioContext, at: number, freq: number, seconds: number, gain: number) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
  osc.connect(g).connect(master!);
  osc.start(at);
  osc.stop(at + seconds + 0.05);
}

const SOUNDS = {
  earn(c: AudioContext, t: number) {
    bell(c, t, 880, 0.7, 0.35);
    bell(c, t + 0.09, 1318.5, 0.9, 0.25);
  },

  done(c: AudioContext, t: number) {
    bell(c, t, 523.25, 0.9, 0.4);
    bell(c, t, 1046.5, 0.5, 0.08);
  },

  levelUp(c: AudioContext, t: number) {
    // A, C♯, E: a major chord built note by note, each left ringing.
    [659.25, 830.61, 987.77, 1318.5].forEach((f, i) =>
      bell(c, t + i * 0.16, f, 1.8 - i * 0.2, 0.22),
    );
  },
};

export type SoundName = keyof typeof SOUNDS;

/** Each moment's vibration, in ms: a tap, a double tap, a little flourish. */
const HAPTICS: Record<SoundName, number | number[]> = {
  earn: 12,
  done: [8, 50, 8],
  levelUp: [10, 70, 10, 70, 24],
};

/**
 * The cue for a moment: the phone answers with a tiny vibration (silent, so
 * always on) and, if sounds are on, its note.
 */
export function cue(name: SoundName) {
  haptic(HAPTICS[name]);
  if (!isSoundOn()) return;
  const c = context();
  if (!c || !master) return;
  if (c.state === "suspended") void c.resume();
  SOUNDS[name](c, c.currentTime + 0.01);
}
