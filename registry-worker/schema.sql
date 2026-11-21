-- Cloudflare D1 persistence for physical gift reservations.
-- Flexible funds do not have reservation locks.
CREATE TABLE IF NOT EXISTS registry_items (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','reserved','purchased')),
  guest_name TEXT,
  guest_email TEXT,
  reservation_token_hash TEXT,
  reserved_until INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
INSERT OR IGNORE INTO registry_items (id) VALUES
  ('luggage'),('cars'),('photo-frame'),('bedding'),('coffee');
CREATE INDEX IF NOT EXISTS idx_registry_reserved_until ON registry_items(status,reserved_until);
