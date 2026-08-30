/**
 * Envoltorio de `fetch` sobre la API del backend. Sin librería de fetching:
 * las páginas usan useState/useEffect a mano en esta fase.
 */

export const API_URL = "http://localhost:3000";

export type Category = {
  id: number;
  name: string;
  slug: string;
  level: number;
  /** XP acumulada total histórica; para la barra usa `progress`. */
  currentXp: number;
  /** XP dentro del nivel actual. El backend lo calcula con la curva real. */
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  /** 0..1 */
  progress: number;
  atMaxLevel: boolean;
  focusCount: number;
  /** ISO, o null si la categoría no tiene actividades todavía. */
  lastActivityAt: string | null;
};

export type Focus = {
  id: number;
  categoryId: number;
  parentFocusId: number | null;
  name: string;
  level: number;
  currentXp: number;
  frozen: boolean;
};

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

/** Cómo quedó una entidad tras recibir la XP. */
export type XpOutcome = {
  id: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
  totalXp: number;
};

export type RegisterActivityResult = {
  activity: Activity;
  xpGained: number;
  focus: XpOutcome | null;
  category: XpOutcome;
};

/**
 * El backend devuelve los errores como { message }. Los propagamos como Error
 * con ese texto para que las páginas puedan enseñarlo tal cual.
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
}): Promise<Focus> {
  return request<Focus>("/focuses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createActivity(data: {
  categoryId: number;
  focusId?: number;
  description: string;
  intensity: Intensity;
  date?: string;
}): Promise<RegisterActivityResult> {
  return request<RegisterActivityResult>("/activities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getActivitiesByCategory(
  categoryId: number,
): Promise<Activity[]> {
  return request<Activity[]>(`/categories/${categoryId}/activities`);
}

export function getActivitiesByFocus(focusId: number): Promise<Activity[]> {
  return request<Activity[]>(`/focuses/${focusId}/activities`);
}
