CREATE TABLE IF NOT EXISTS naviga_task_boards (
  scope_key TEXT PRIMARY KEY CHECK (length(trim(scope_key)) > 0),
  board_data JSONB NOT NULL CHECK (jsonb_typeof(board_data) = 'object'),
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS naviga_task_boards_updated_at_idx
  ON naviga_task_boards (updated_at DESC);
