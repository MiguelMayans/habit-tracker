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
