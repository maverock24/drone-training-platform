import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// Existing users table — will be extended in Migration 001
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});
