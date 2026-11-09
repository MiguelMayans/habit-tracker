/**
 * The phone's back button closes the open sheet instead of leaving the
 * screen. That is what every native app does, and an installed PWA has no
 * other "back" to reach for.
 *
 * While any dialog is open there is one extra history entry under them. Back
 * pops it, and the top dialog closes. Dialogs are a stack because one can
 * replace another in a single commit (a sheet giving way to its confirmation),
 * so the entry is only removed a tick later, if nothing took over.
 *
 * The entry keeps the router's own state and the same URL: to the router it is
 * still the same screen.
 */
const stack: { close: () => void }[] = [];
let hasEntry = false;
let listening = false;

function onPop() {
  hasEntry = false;
  const top = stack[stack.length - 1];
  top?.close();
  // Something stayed open (a confirmation gone, its sheet back): back must
  // keep working for that one too.
  window.setTimeout(sync, 0);
}

function sync() {
  if (stack.length > 0 && !hasEntry) {
    window.history.pushState({ ...window.history.state, dialogEntry: true }, "");
    hasEntry = true;
  } else if (stack.length === 0) {
    window.removeEventListener("popstate", onPop);
    listening = false;
    // Only pop our own entry: if closing the dialog came with a navigation
    // ("Hecho" on the result sheet), that page is on top now, and going back
    // would undo it.
    if (hasEntry && window.history.state?.dialogEntry) window.history.back();
    hasEntry = false;
  }
}

/** Registers an open dialog; returns what to call when it unmounts. */
export function registerDialog(close: () => void): () => void {
  const entry = { close };
  stack.push(entry);
  if (!listening) {
    window.addEventListener("popstate", onPop);
    listening = true;
  }
  window.setTimeout(sync, 0);
  return () => {
    stack.splice(stack.indexOf(entry), 1);
    window.setTimeout(sync, 0);
  };
}
