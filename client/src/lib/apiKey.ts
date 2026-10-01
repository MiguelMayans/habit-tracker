/**
 * The API key, kept on the device after you type it once.
 *
 * localStorage can throw (private mode, blocked site data), so every access
 * is guarded: a phone that cannot remember the key simply asks again.
 */
const STORAGE_KEY = "mikes-life:api-key";

/** Fired when the server rejects the key; App shows the unlock screen. */
export const LOCKED_EVENT = "api-locked";

export function getApiKey(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setApiKey(key: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // Nothing to do: the key works for this session and is asked for again.
  }
}
