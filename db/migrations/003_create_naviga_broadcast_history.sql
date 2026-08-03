CREATE TABLE IF NOT EXISTS naviga_broadcast_history (
  id TEXT PRIMARY KEY CHECK (length(trim(id)) > 0),
  scope_key TEXT NOT NULL CHECK (length(trim(scope_key)) > 0),
  type TEXT NOT NULL CHECK (type IN ('Gadaian Broadcast', 'Angsuran Broadcast')),
  customer_name TEXT NOT NULL CHECK (length(trim(customer_name)) BETWEEN 1 AND 255),
  customer_identifier TEXT NOT NULL CHECK (length(trim(customer_identifier)) BETWEEN 1 AND 120),
  status TEXT NOT NULL CHECK (length(trim(status)) BETWEEN 1 AND 80),
  template TEXT NOT NULL CHECK (length(trim(template)) BETWEEN 1 AND 80),
  created_by_user_id TEXT NOT NULL CHECK (length(trim(created_by_user_id)) > 0),
  created_by_name TEXT NOT NULL CHECK (length(trim(created_by_name)) BETWEEN 1 AND 255),
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS naviga_broadcast_history_legacy_idx
  ON naviga_broadcast_history (scope_key, legacy_id)
  WHERE legacy_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS naviga_broadcast_history_scope_created_idx
  ON naviga_broadcast_history (scope_key, created_at DESC);
