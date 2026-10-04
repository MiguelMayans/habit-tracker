import { asc, eq, gte, isNull, or } from "drizzle-orm";
import { db, type DbOrTx } from "../db/index.js";
import { missions } from "../db/schema.js";

export type Mission = typeof missions.$inferSelect;

export type CreateMissionData = {
  title: string;
  dueDate: string | null;
  categoryId: number | null;
};

/**
 * Every pending mission plus the ones completed since `completedSince`. The
 * done list is there to undo a slip and to enjoy what you got through, not to
 * keep a growing archive on screen.
 */
export async function getMissions(completedSince: Date): Promise<Mission[]> {
  return db
    .select()
    .from(missions)
    .where(
      or(isNull(missions.completedAt), gte(missions.completedAt, completedSince)),
    )
    .orderBy(asc(missions.createdAt), asc(missions.id));
}

export async function getMissionById(
  id: number,
  executor: DbOrTx = db,
): Promise<Mission | null> {
  const [mission] = await executor
    .select()
    .from(missions)
    .where(eq(missions.id, id))
    .limit(1);

  return mission ?? null;
}

export async function createMission(data: CreateMissionData): Promise<Mission> {
  const [mission] = await db.insert(missions).values(data).returning();
  return mission;
}

export async function updateMission(
  id: number,
  values: Partial<
    Pick<
      Mission,
      "title" | "dueDate" | "categoryId" | "activityId" | "completedAt"
    >
  >,
  executor: DbOrTx = db,
): Promise<Mission> {
  const [mission] = await executor
    .update(missions)
    .set(values)
    .where(eq(missions.id, id))
    .returning();

  return mission;
}

export async function deleteMission(id: number): Promise<void> {
  await db.delete(missions).where(eq(missions.id, id));
}
