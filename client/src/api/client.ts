/**
 * A `fetch` wrapper over the backend API. No fetching library: at this stage
 * the pages use useState/useEffect by hand.
 */

/**
 * In production Vite injects this at build time (`VITE_API_URL`), where the
 * API is served under the same domain as the client. The local value is the
 * fallback, so `pnpm dev` keeps working with nothing to configure.
 */
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type Category = {
  id: number;
  name: string;
  slug: string;
  level: number;
  /** Total XP accumulated over time; for the bar, use `progress` instead. */
  currentXp: number;
  /** XP within the current level. The backend derives it from the curve. */
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  /** 0..1 */
  progress: number;
  atMaxLevel: boolean;
  focusCount: number;
  /** ISO string, or null when the category has no activities yet. */
  lastActivityAt: string | null;
};

/** The raw row: what `POST /focuses` returns, with no progress computed. */
export type FocusRow = {
  id: number;
  categoryId: number;
  parentFocusId: number | null;
  name: string;
  level: number;
  /** XP acumulada total histórica; para la barra usa `progress`. */
  currentXp: number;
  frozen: boolean;
};

/** Progress within the level, computed on the server from the real curve. */
export type Progress = {
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  /** 0..1 */
  progress: number;
  atMaxLevel: boolean;
};

/** What the focus listing of a category returns. */
export type Focus = FocusRow & Progress;

export type Intensity = "chispa" | "impulso" | "all_out";

export type Activity = {
  id: number;
  categoryId: number;
  focusId: number | null;
  description: string;
  intensity: Intensity;
  date: string;
  createdAt: string;
};

/**
 * An activity with the context that only makes sense in a GLOBAL list (one not
 * already filtered by category or focus): which category it belongs to and, if
 * it has a focus, that focus's name and whether it is frozen RIGHT NOW — not
 * how it stood when the activity was logged.
 */
export type RecentActivity = Activity & {
  categorySlug: string;
  focusName: string | null;
  focusFrozen: boolean | null;
};

/** How an entity ended up after taking the XP. */
export type XpOutcome = {
  id: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
  totalXp: number;
  /** In-level progress before and after, 0..1: the bar travels between them. */
  progressBefore: number;
  progressAfter: number;
  xpToNextLevel: number;
  atMaxLevel: boolean;
  /** Only meaningful on a Focus: on a category it is always `false`. */
  frozen: boolean;
};

export type RegisterActivityResult = {
  activity: Activity;
  xpGained: number;
  focus: XpOutcome | null;
  category: XpOutcome;
};

export type UndoActivityResult = {
  activityId: number;
  xpLost: number;
  focus: XpOutcome | null;
  category: XpOutcome;
};

/**
 * The backend returns errors as { message }. They are rethrown as an Error
 * carrying that text, so the pages can show it verbatim.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      ...init,
    });
  } catch {
    throw new Error(
      `No se puede conectar con el servidor en ${API_URL}. ¿Está arrancado?`,
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Error ${response.status} en ${path}`);
  }

  return response.json() as Promise<T>;
}

export function getCategories(): Promise<Category[]> {
  return request<Category[]>("/categories");
}

export function getCategory(id: number): Promise<Category> {
  return request<Category>(`/categories/${id}`);
}

export function getFocusesByCategory(categoryId: number): Promise<Focus[]> {
  return request<Focus[]>(`/categories/${categoryId}/focuses`);
}

export function createFocus(data: {
  categoryId: number;
  name: string;
  parentFocusId?: number;
}): Promise<FocusRow> {
  return request<FocusRow>("/focuses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * What can be edited on a focus by hand. `frozen: true` calls it done — you
 * finished the book, you lost the weight: it stops taking activity and becomes
 * able to spawn a child. A manual close can be reversed; mastery at level 20
 * cannot, and the server rejects the attempt.
 */
export function updateFocus(
  id: number,
  changes: { name?: string; frozen?: boolean },
): Promise<FocusRow> {
  return request<FocusRow>(`/focuses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

export function deleteFocus(id: number): Promise<{
  /** Activities left without a focus that still count toward the category. */
  activitiesDetached: number;
}> {
  return request(`/focuses/${id}`, { method: "DELETE" });
}

export function createActivity(data: {
  categoryId: number;
  focusId?: number;
  /** Optional: what matters is that it happened, and at what intensity. */
  description?: string;
  intensity: Intensity;
  date?: string;
}): Promise<RegisterActivityResult> {
  return request<RegisterActivityResult>("/activities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Only today's activities can be undone: see the exception in docs/DESIGN.md. */
export function deleteActivity(id: number): Promise<UndoActivityResult> {
  return request<UndoActivityResult>(`/activities/${id}`, {
    method: "DELETE",
  });
}

export function getActivitiesByCategory(
  categoryId: number,
): Promise<Activity[]> {
  return request<Activity[]>(`/categories/${categoryId}/activities`);
}

/**
 * Across all categories, not just one: this feeds the streak, today's summary
 * and the rhythm strip on the home screen.
 */
export function getRecentActivities(params: {
  since?: string;
  limit?: number;
} = {}): Promise<RecentActivity[]> {
  const query = new URLSearchParams();
  if (params.since !== undefined) query.set("since", params.since);
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  const qs = query.toString();

  return request<RecentActivity[]>(`/activities${qs === "" ? "" : `?${qs}`}`);
}
