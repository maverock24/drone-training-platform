-- Migration 003: Create enrollments and lesson_progress tables
-- Applied via: node --env-file=.env.local src/db/migrations/apply_003.mjs

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  track_id TEXT NOT NULL,
  enrolled_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  certificate_url TEXT,
  UNIQUE(user_id, track_id)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
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
);
