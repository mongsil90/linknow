-- LinkNow MVP2 schema for Cloudflare D1
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profiles (
  username TEXT PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  avatar_text TEXT,
  theme TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (username) REFERENCES profiles(username) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  link_id TEXT,
  ts TEXT DEFAULT (datetime('now')),
  referrer TEXT,
  ua TEXT
);

CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_links_username ON links(username);
CREATE INDEX IF NOT EXISTS idx_links_username_sort ON links(username, sort_order);
CREATE INDEX IF NOT EXISTS idx_clicks_username ON clicks(username);
CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
