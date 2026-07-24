import { createClient } from "@supabase/supabase-js";

export interface ThreatEvent {
  id: string;
  source: "trap_api" | "honeypot";
  threat_type: string;
  severity: string;
  source_ip: string | null;
  payload_snippet: string | null;
  matched_pattern: string | null;
  ai_analysis: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AutoBanAlert {
  id: string;
  bannedIp: string;
  attackCount: number;
  threshold: number;
  timestamp: string;
}

export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

export async function fetchHistoricalThreats(limit = 50): Promise<ThreatEvent[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("threat_events")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[supabase] fetch threats:", error.message);
    return [];
  }

  return (data ?? []) as ThreatEvent[];
}

export async function fetchThreatStats(): Promise<Record<string, number>> {
  const supabase = createServerSupabase();
  if (!supabase) return {};

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("threat_events")
    .select("threat_type")
    .gte("created_at", since);

  if (error) return {};

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const t = row.threat_type as string;
    counts[t] = (counts[t] ?? 0) + 1;
  }
  return counts;
}

export async function fetchAutoBanAlerts(limit = 5): Promise<AutoBanAlert[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("threat_events")
    .select("id, source_ip, metadata, created_at")
    .eq("threat_type", "AUTO_BAN")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  return (data ?? []).map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: row.id as string,
      bannedIp: String(row.source_ip ?? meta.banned_ip ?? "unknown"),
      attackCount: Number(meta.attack_count ?? 5),
      threshold: Number(meta.trigger_threshold ?? 5),
      timestamp: row.created_at as string,
    };
  });
}
