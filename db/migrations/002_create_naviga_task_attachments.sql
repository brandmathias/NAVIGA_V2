CREATE TABLE IF NOT EXISTS naviga_task_attachments (
  id TEXT PRIMARY KEY CHECK (length(trim(id)) > 0),
  scope_key TEXT NOT NULL CHECK (length(trim(scope_key)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0 AND length(name) <= 255),
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream' CHECK (length(mime_type) <= 120),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  content_bytes BYTEA NOT NULL,
  created_by_user_id TEXT NOT NULL CHECK (length(trim(created_by_user_id)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS naviga_task_attachments_scope_idx
  ON naviga_task_attachments (scope_key, created_at DESC);
