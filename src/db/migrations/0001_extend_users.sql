-- Migration 001: Extend users table with role, email, profile fields
-- Applied via: drizzle-kit push (Turso)

ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student';
ALTER TABLE users ADD COLUMN full_name TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN locale TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN email_verified_at TEXT;
ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT (datetime('now'));
