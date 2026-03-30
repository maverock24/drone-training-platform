import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Run this once in your Turso CLI or dashboard to create the table:
// CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT);
