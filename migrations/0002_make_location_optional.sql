-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table
-- Make latitude and longitude optional (NULL allowed)

-- Create new table with optional location fields
CREATE TABLE IF NOT EXISTS posts_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  location TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy data from old table
INSERT INTO posts_new SELECT * FROM posts;

-- Drop old table
DROP TABLE posts;

-- Rename new table
ALTER TABLE posts_new RENAME TO posts;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
