// Apply Migration 001: Extend users table
// Run via: node --env-file=.env.local src/db/migrations/apply_001.mjs

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const statements = [
  "ALTER TABLE users ADD COLUMN email TEXT",
  "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'",
  "ALTER TABLE users ADD COLUMN full_name TEXT",
  "ALTER TABLE users ADD COLUMN avatar_url TEXT",
  "ALTER TABLE users ADD COLUMN locale TEXT DEFAULT 'en'",
  "ALTER TABLE users ADD COLUMN stripe_customer_id TEXT",
  "ALTER TABLE users ADD COLUMN email_verified_at TEXT",
  "ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT (datetime('now'))",
];

for (const sql of statements) {
  try {
    await client.execute(sql);
    console.log(`✓ ${sql.slice(0, 60)}...`);
  } catch (err) {
    if (err.message?.includes("duplicate column")) {
      console.log(`⊘ Already exists: ${sql.slice(0, 60)}...`);
    } else {
      console.error(`✗ Failed: ${sql.slice(0, 60)}...`);
      console.error(`  ${err.message}`);
    }
  }
}

console.log("\nMigration 001 complete.");
process.exit(0);
