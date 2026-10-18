/**
 * The app's few sounds, synthesised with the Web Audio API.
 *
 * Only three, each tied to a moment that already has its own animation:
 * - `hit`: earning XP — a dry thump with a bright metallic tick on top.
 * - `stamp`: ticking off a mission or finishing a work — a slash of noise
 *   and a thud, the stamp landing.
 * - `levelUp`: a rank up — a quick rising arpeggio into a held chord, on the
 *   beat the "¡NIVEL N!" band crosses the screen.
 * Nothing on ordinary taps or navigation: a sound on every button stops
 * meaning anything, the same lesson the celebrations already learned.
 *
 * Synthesised rather than shipped as files: no assets to load or cache, and
 * they inherit the app's register — short, hard, no reverb tails.
 *
 * Browsers only let audio start after the user has interacted with the page.
 * `armSound` unlocks the context on the first touch, so a sound that fires
 * after a network round trip (when the gesture is long gone) still plays.
 */

const STORAGE_KEY = "mikes-life:sound";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function isSoundOn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
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
  // A compressor before the output, so layered sounds (a stamp and a hit
  // landing together) never clip into distortion.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 6;
  master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(comp).connect(ctx.destination);
  return ctx;
}

/** Unlocks audio on the first touch. Call once, at startup. */
export function armSound() {
  const unlock = () => {
    const c = context();
    void c?.resume();
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
}

function noiseBuffer(c: AudioContext, seconds: number): AudioBuffer {
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** A pitched drop: the body of a hit. */
function thump(c: AudioContext, at: number, from: number, to: number, gain: number) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + 0.16);
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + 0.22);
  osc.connect(g).connect(master!);
  osc.start(at);
  osc.stop(at + 0.24);
}

/** A burst of filtered noise. */
function noise(
  c: AudioContext,
  at: number,
  seconds: number,
  filter: BiquadFilterType,
  freq: [number, number],
  gain: number,
) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, seconds);
  const f = c.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq[0], at);
  f.frequency.exponentialRampToValueAtTime(freq[1], at + seconds);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + seconds);
  src.connect(f).connect(g).connect(master!);
  src.start(at);
}

/** A short tone with a fast attack. */
function tone(
  c: AudioContext,
  at: number,
  freq: number,
  seconds: number,
  type: OscillatorType,
  gain: number,
  detune = 0,
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  const lp = c.createBiquadFilter();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  lp.type = "lowpass";
  lp.frequency.value = 4200;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, at + seconds);
  osc.connect(lp).connect(g).connect(master!);
  osc.start(at);
  osc.stop(at + seconds + 0.02);
}

const SOUNDS = {
  hit(c: AudioContext, t: number) {
    thump(c, t, 190, 48, 0.9);
    noise(c, t, 0.07, "bandpass", [2200, 900], 0.5);
    // The tick that says "XP", not just "bump".
    tone(c, t + 0.015, 1568, 0.14, "triangle", 0.22);
    tone(c, t + 0.06, 2093, 0.16, "triangle", 0.14);
  },

  stamp(c: AudioContext, t: number) {
    // The slash: noise swept down through a high-pass, fast.
    noise(c, t, 0.13, "highpass", [7500, 1100], 0.45);
    // The stamp landing, just after.
    thump(c, t + 0.13, 130, 42, 1);
    noise(c, t + 0.13, 0.05, "lowpass", [900, 300], 0.6);
  },

  levelUp(c: AudioContext, t: number) {
    thump(c, t, 160, 40, 0.8);
    // C major, up to the octave: quick and bright, like a rank-up chime.
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => tone(c, t + i * 0.065, f, 0.16, "square", 0.11));
    // The held chord, two slightly detuned voices per note for width.
    const held = t + 0.3;
    for (const f of [523.25, 783.99, 1046.5, 1318.5]) {
      tone(c, held, f, 0.85, "sawtooth", 0.05, -7);
      tone(c, held, f, 0.85, "sawtooth", 0.05, 7);
    }
  },
};

export type SoundName = keyof typeof SOUNDS;

export function playSound(name: SoundName) {
  if (!isSoundOn()) return;
  const c = context();
  if (!c || !master) return;
  if (c.state === "suspended") void c.resume();
  SOUNDS[name](c, c.currentTime + 0.01);
}
