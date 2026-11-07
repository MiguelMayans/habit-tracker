import { asc, eq } from "drizzle-orm";
import { db, type DbOrTx } from "../db/index.js";
import { works } from "../db/schema.js";

export type Work = typeof works.$inferSelect;
export type WorkKind = Work["kind"];
export type WorkStatus = Work["status"];

export const WORK_KINDS: readonly WorkKind[] = [
  "game", "book", "series", "movie", "anime", "comic",
];
export const WORK_STATUSES: readonly WorkStatus[] = ["active", "queued", "done"];

export type WorkValues = Partial<
  Pick<
    Work,
    | "kind"
    | "title"
    | "status"
    | "progress"
    | "percent"
    | "rating"
    | "startedAt"
    | "finishedAt"
    | "lastSessionAt"
  >
>;

/** All of them: a personal shelf is small enough to send whole. */
export async function getWorks(): Promise<Work[]> {
  return db.select().from(works).orderBy(asc(works.createdAt), asc(works.id));
}

export async function getWorkById(
  id: number,
  executor: DbOrTx = db,
): Promise<Work | null> {
  const [work] = await executor
    .select()
    .from(works)
    .where(eq(works.id, id))
    .limit(1);

  return work ?? null;
}

export async function createWork(
  values: WorkValues & Pick<Work, "kind" | "title" | "status">,
): Promise<Work> {
  const [work] = await db.insert(works).values(values).returning();
  return work;
}

export async function updateWork(
  id: number,
  values: WorkValues,
  executor: DbOrTx = db,
): Promise<Work> {
  const [work] = await executor
    .update(works)
    .set(values)
    .where(eq(works.id, id))
    .returning();

  return work;
}

export async function deleteWork(id: number): Promise<void> {
  await db.delete(works).where(eq(works.id, id));
}
