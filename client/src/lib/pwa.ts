import { registerSW } from "virtual:pwa-register";

/** Fired when a new version is downloaded and waiting; App shows the banner. */
export const UPDATE_EVENT = "app-update-ready";

/** How often an app left open checks for a new version. */
const CHECK_EVERY_MS = 60 * 60 * 1000;

let applyUpdate: (() => Promise<void>) | null = null;

/**
 * Installs the service worker (see vite.config.ts for what it caches) and
 * wires how new versions arrive. In `pnpm dev` this does nothing: the
 * service worker only exists in the production build.
 *
 * Updates are "prompt": a new version downloads in the background and WAITS.
 * The app shows a banner and you choose when to switch, so a reload never
 * lands in the middle of typing a note or a level-up.
 *
 * The browser only checks for a new version when a page is opened. An
 * installed app sent to the background and brought back does not open
 * anything, so it would never find out; hence the check on returning to the
 * foreground, and once an hour while it stays open.
 */
export function startServiceWorker() {
  applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(new Event(UPDATE_EVENT));
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (document.visibilityState === "visible") registration.update();
      };
      document.addEventListener("visibilitychange", check);
      window.setInterval(check, CHECK_EVERY_MS);
    },
  });
}

/**
 * Switches to the waiting version: the new service worker takes over and the
 * page reloads with the new code.
 */
export function updateNow() {
  return applyUpdate?.();
}
