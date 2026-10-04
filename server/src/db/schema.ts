import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  level: integer("level").notNull().default(1),
  currentXp: integer("current_xp").notNull().default(0),
});

export const focuses = sqliteTable("focuses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  parentFocusId: integer("parent_focus_id").references(
    (): AnySQLiteColumn => focuses.id,
  ),
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
  currentXp: integer("current_xp").notNull().default(0),
  frozen: integer("frozen", { mode: "boolean" }).notNull().default(false),
});

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  focusId: integer("focus_id").references(() => focuses.id),
  description: text("description").notNull(),
  intensity: text("intensity", {
    enum: ["chispa", "impulso", "all_out"],
  }).notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * The missions: errands and calls to get done ("call the plumber", "book the
 * ITV"), apart from the activities, which are logged after the fact.
 *
 * - `dueDate` is a local calendar day, "YYYY-MM-DD", and not a timestamp:
 *   "due today" has to mean the user's today, and only the browser knows their
 *   time zone. Stored as a day, it means the same thing everywhere.
 * - With a `categoryId`, completing it logs a Chispa in that category
 *   (docs/DESIGN.md). Without one it is just a list item and earns nothing.
 * - `activityId` is the activity that completion logged, so reopening can undo
 *   it. Deliberately NOT a foreign key: Turso enforces them, and the activity
 *   can still be undone from the category's history — a constraint would block
 *   that undo for as long as the mission existed.
 */
export const missions = sqliteTable("missions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  dueDate: text("due_date"),
  categoryId: integer("category_id").references(() => categories.id),
  activityId: integer("activity_id"),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
