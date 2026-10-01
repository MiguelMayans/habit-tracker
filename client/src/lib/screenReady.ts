import { createContext, useContext, useEffect } from "react";

/** Filled in by ScreenTransition; a no-op outside it. */
export const ReadyContext = createContext<(ready: boolean) => void>(() => {});

/**
 * For screens that load data on mount: tells the wipe whether to wait.
 *
 * While `ready` is false the slab stays down, its star spinning like a
 * loading screen, and it lifts the moment the data is in. Without this the
 * wipe uncovered a screen that was still empty and filled in a beat later,
 * which made the transition look broken rather than deliberate.
 */
export function useScreenReady(ready: boolean) {
  const report = useContext(ReadyContext);
  useEffect(() => {
    report(ready);
  }, [ready, report]);
}
