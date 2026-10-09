-- Shared admission counters for public AI chat. No prompts or raw IP addresses.
CREATE TABLE IF NOT EXISTS ai_usage_limits (
  key TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_limits_expiry ON ai_usage_limits (expires_at);
