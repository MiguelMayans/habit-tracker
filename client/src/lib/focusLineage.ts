import type { Focus } from "../api/client";

/**
 * Parents in the order the API returned them, each immediately followed by its
 * children.
 *
 * The backend lists focuses in insertion order, and a child is always created
 * after its parent — often much later, since the parent has to be finished
 * first. So a child arrived at the bottom of the list, several rows below the
 * thing it belongs to, and no amount of drawing could make it hang off it.
 *
 * Orphans are appended rather than dropped. The API should not produce any —
 * a parent with children cannot be deleted and a child lives in its parent's
 * category — but losing a focus from the list would be a far worse failure
 * than showing it out of place.
 */
export function orderByLineage(focuses: Focus[]): Focus[] {
  const childrenOf = new Map<number, Focus[]>();
  for (const f of focuses) {
    if (f.parentFocusId === null) continue;
    const siblings = childrenOf.get(f.parentFocusId) ?? [];
    siblings.push(f);
    childrenOf.set(f.parentFocusId, siblings);
  }

  const ordered: Focus[] = [];
  const placed = new Set<number>();

  for (const f of focuses) {
    if (f.parentFocusId !== null) continue;
    ordered.push(f);
    placed.add(f.id);
    for (const child of childrenOf.get(f.id) ?? []) {
      ordered.push(child);
      placed.add(child.id);
    }
  }

  for (const f of focuses) {
    if (!placed.has(f.id)) ordered.push(f);
  }

  return ordered;
}
