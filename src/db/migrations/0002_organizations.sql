-- Migration 002: Create organizations and organization_members tables
-- Applied via: node --env-file=.env.local src/db/migrations/apply_002.mjs

CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  max_seats INTEGER DEFAULT 10,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS organization_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT DEFAULT 'member',
  invited_at TEXT DEFAULT (datetime('now')),
  accepted_at TEXT,
  UNIQUE(org_id, user_id)
);
