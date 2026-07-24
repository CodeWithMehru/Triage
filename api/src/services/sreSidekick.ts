import { trace, SpanStatusCode } from "@opentelemetry/api";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { insertThreatEvent } from "./supabaseWriter.js";

const ATTACK_WINDOW_MS = 60_000;
const BAN_THRESHOLD = 5;

export interface AutoBanResult {
  bannedIp: string;
  attackCount: number;
  threshold: number;
}

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export async function isIpBanned(ip: string): Promise<boolean> {
  const supabase = getClient();
  if (!supabase) return false;

  const banDurationMs = 24 * 60 * 60 * 1000;
  const since = new Date(Date.now() - banDurationMs).toISOString();

  const { count, error } = await supabase
    .from("threat_events")
    .select("*", { count: "exact", head: true })
    .eq("source_ip", ip)
    .eq("threat_type", "AUTO_BAN")
    .gte("created_at", since);

  if (error) {
    console.error("[sre-sidekick] ban check failed:", error.message);
    return false;
  }

  return (count ?? 0) > 0;
}

export async function recordAttackAndCheckBan(
  ip: string
): Promise<AutoBanResult | null> {
  const supabase = getClient();
  if (!supabase) return null;

  if (await isIpBanned(ip)) return null;

  const since = new Date(Date.now() - ATTACK_WINDOW_MS).toISOString();

  const { count, error } = await supabase
    .from("threat_events")
    .select("*", { count: "exact", head: true })
    .eq("source_ip", ip)
    .neq("threat_type", "AUTO_BAN")
    .gte("created_at", since);

  if (error) {
    console.error("[sre-sidekick] attack count failed:", error.message);
    return null;
  }

  const attackCount = count ?? 0;
  if (attackCount < BAN_THRESHOLD) return null;

  const { count: existingBan } = await supabase
    .from("threat_events")
    .select("*", { count: "exact", head: true })
    .eq("source_ip", ip)
    .eq("threat_type", "AUTO_BAN")
    .gte("created_at", since);

  if ((existingBan ?? 0) > 0) return null;

  const result: AutoBanResult = {
    bannedIp: ip,
    attackCount,
    threshold: BAN_THRESHOLD,
  };

  emitAutoBanSpan(result);
  await persistAutoBanEvent(result);

  return result;
}

function emitAutoBanSpan(result: AutoBanResult): void {
  const tracer = trace.getTracer("sentinel-trap-api");

  tracer.startActiveSpan("sre.auto_ban.triggered", (span) => {
    span.setAttribute("banned_ip", result.bannedIp);
    span.setAttribute("trigger_threshold", result.threshold);
    span.setAttribute("attack_count", result.attackCount);
    span.setAttribute("security.severity", "CRITICAL");
    span.setAttribute("sre.action", "auto_ban");
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: `Auto-banned ${result.bannedIp}`,
    });
    span.end();
  });

  console.warn(
    `[sre-sidekick] AUTO-BAN triggered for ${result.bannedIp} (${result.attackCount} attacks in 60s)`
  );
}

async function persistAutoBanEvent(result: AutoBanResult): Promise<void> {
  await insertThreatEvent({
    source: "trap_api",
    threat_type: "AUTO_BAN",
    severity: "CRITICAL",
    source_ip: result.bannedIp,
    payload_snippet: null,
    matched_pattern: "sre.auto_ban.triggered",
    ai_analysis: `SRE Sidekick auto-banned ${result.bannedIp} after ${result.attackCount} attacks in 60s`,
    metadata: {
      banned_ip: result.bannedIp,
      attack_count: result.attackCount,
      trigger_threshold: result.threshold,
    },
  });
}

export function getBanThreshold(): number {
  return BAN_THRESHOLD;
}
