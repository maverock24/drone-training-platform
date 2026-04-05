import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ── Users (Migration 001 extends the original 3-column table) ──
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique(),
  role: text("role").default("student").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  locale: text("locale").default("en"),
  stripeCustomerId: text("stripe_customer_id"),
  emailVerifiedAt: text("email_verified_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ── Enrollments (Migration 003) ──
export const enrollments = sqliteTable("enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  trackId: text("track_id").notNull(),
  enrolledAt: text("enrolled_at").default(sql`(datetime('now'))`),
  completedAt: text("completed_at"),
  certificateUrl: text("certificate_url"),
});

// ── Lesson Progress (Migration 003) ──
export const lessonProgress = sqliteTable("lesson_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  trackId: text("track_id").notNull(),
  moduleId: text("module_id").notNull(),
  lessonId: text("lesson_id").notNull(),
  status: text("status").default("not_started"),
  score: real("score"),
  completedAt: text("completed_at"),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});
