import { reducedMotion } from "./viewTransition";

/**
 * A tiny vibration when something lands — a log, a tick, a step of progress —
 * so the phone answers the thumb without making a sound. Android only (iOS
 * Safari has no vibration API); off with reduced motion, which on Android
 * also covers people who turned animations off.
 */
export function haptic(pattern: number | number[] = 10) {
  if (reducedMotion() || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw if called outside a gesture: it is only a nicety.
  }
}
