CREATE TABLE IF NOT EXISTS delivery_correlations (
  request_id TEXT PRIMARY KEY,
  submission_hash TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL DEFAULT 'thehouseofdental',
  resend_message_id TEXT,
  provider_status TEXT NOT NULL,
  provider_status_code INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_webhook_id TEXT,
  last_webhook_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_delivery_correlations_resend_message_id
  ON delivery_correlations (resend_message_id);

CREATE TABLE IF NOT EXISTS delivery_webhook_events (
  webhook_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  resend_message_id TEXT,
  provider_event_at TEXT,
  received_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_delivery_webhook_events_resend_message_id
  ON delivery_webhook_events (resend_message_id);
