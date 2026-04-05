// Apply Migration 003: Create enrollments and lesson_progress tables
// Run via: node --env-file=.env.local src/db/migrations/apply_003.mjs

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const statements = [
  `CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    track_id TEXT NOT NULL,
    enrolled_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    certificate_url TEXT,
    UNIQUE(user_id, track_id)
  )`,
  `CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    track_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    status TEXT DEFAULT 'not_started',
    score REAL,
    completed_at TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, track_id, module_id, lesson_id)
  )`,
];

for (const sql of statements) {
  try {
    await client.execute(sql);
    const tableName = sql.match(/CREATE TABLE.*?(\w+)\s*\(/)?.[1];
    console.log(`✓ Created table: ${tableName}`);
  } catch (err) {
    console.error(`✗ Failed: ${err.message}`);
  }
}

console.log("\nMigration 003 complete.");
process.exit(0);
