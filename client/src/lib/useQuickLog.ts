import { useEffect, useState } from "react";
import {
  createActivity,
  deleteActivity,
  type Intensity,
  type RegisterActivityResult,
} from "../api/client";

/**
 * Logging in two taps, wherever a list of focuses is shown.
 *
 * It lives in a hook and not in a component because the home card and the
 * category detail draw their focuses very differently but the gesture has to
 * MEAN the same thing in both: tap a focus, pick an intensity, done. When the
 * two screens each had their own version, the same tap opened a panel in one
 * and navigated away in the other.
 */
export function useQuickLog({
  categoryId,
  onAfterChange,
}: {
  categoryId: number;
  /** Runs after logging or undoing, to refresh whatever is on screen. */
  onAfterChange: () => void;
}) {
  const [openFocusId, setOpenFocusId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterActivityResult | null>(null);
  const [gain, setGain] = useState<{ focusId: number; xp: number } | null>(
    null,
  );

  // The +XP withdraws itself. The timer lives in an effect so it is cancelled
  // if you leave the screen before it finishes.
  useEffect(() => {
    if (!gain) return;
    const t = window.setTimeout(() => setGain(null), 1800);
    return () => window.clearTimeout(t);
  }, [gain]);

  function toggle(focusId: number) {
    setError(null);
    setOpenFocusId((current) => (current === focusId ? null : focusId));
  }

  function close() {
    setOpenFocusId(null);
  }

  /**
   * The description is left empty on purpose. It is optional by design — what
   * counts is that it happened and at what intensity — and a form is exactly
   * what this path exists to avoid.
   */
  async function log(focusId: number, intensity: Intensity) {
    setError(null);
    setBusy(true);

    try {
      const res = await createActivity({ categoryId, focusId, intensity });
      setOpenFocusId(null);
      setGain({ focusId, xp: res.xpGained });

      // The celebration is spent only where it is earned. Firing it on every
      // log, including a routine +10 that changes nothing, is what stopped it
      // being a celebration.
      if (res.focus?.leveledUp || res.category.leveledUp) setResult(res);

      onAfterChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    if (!result) return;
    await deleteActivity(result.activity.id);
    setGain(null);
    onAfterChange();
  }

  return {
    openFocusId,
    busy,
    error,
    result,
    gain,
    toggle,
    close,
    log,
    undo,
    dismissResult: () => setResult(null),
  };
}
