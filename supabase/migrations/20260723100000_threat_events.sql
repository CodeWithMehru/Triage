-- Sentinel-OTel: persistent threat event store (beyond SigNoz retention)

CREATE TABLE IF NOT EXISTS threat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('trap_api', 'honeypot')),
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'CRITICAL',
  source_ip INET,
  payload_snippet TEXT,
  matched_pattern TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_threat_events_created_at
  ON threat_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_threat_events_threat_type
  ON threat_events (threat_type);

CREATE INDEX IF NOT EXISTS idx_threat_events_source
  ON threat_events (source);

ALTER TABLE threat_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_threat_events"
  ON threat_events
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "authenticated_read_threat_events"
  ON threat_events
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE only via service_role from backend services (no public policies)
