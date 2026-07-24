-- Add AI analysis column for payload goal summaries

ALTER TABLE threat_events
  ADD COLUMN IF NOT EXISTS ai_analysis TEXT;

CREATE INDEX IF NOT EXISTS idx_threat_events_auto_ban
  ON threat_events (created_at DESC)
  WHERE threat_type = 'AUTO_BAN';
