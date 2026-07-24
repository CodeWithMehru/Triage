import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { ThreatMatch } from "../rules/threatPatterns.js";

export interface ThreatEventPayload {
  source: "trap_api" | "honeypot";
  threat_type: string;
  severity: string;
  source_ip: string | null;
  payload_snippet: string | null;
  matched_pattern: string | null;
  ai_analysis?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AiAnalysisMeta {
  goal: string;
  latencyMs: number;
  tokenUsage: number;
  model: string;
  provider: string;
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

export async function persistThreatEvent(
  match: ThreatMatch,
  sourceIp: string,
  requestPath: string,
  fullPayload: string,
  aiMeta?: AiAnalysisMeta | null
): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;

  const event: ThreatEventPayload = {
    source: "trap_api",
    threat_type: match.type,
    severity: "CRITICAL",
    source_ip: sourceIp,
    payload_snippet: fullPayload,
    matched_pattern: match.ruleName,
    ai_analysis: aiMeta?.goal ?? null,
    metadata: {
      surface: match.surface,
      path: requestPath,
      matched_fragment: match.matchedText,
      ...(aiMeta
        ? {
            llm_latency_ms: aiMeta.latencyMs,
            llm_token_usage: aiMeta.tokenUsage,
            llm_model: aiMeta.model,
            llm_provider: aiMeta.provider,
          }
        : {}),
    },
  };

  const { error } = await supabase.from("threat_events").insert(event);
  if (error) {
    console.error("[supabase] threat insert failed:", error.message);
  }
}

export async function insertThreatEvent(
  event: ThreatEventPayload
): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;

  const { error } = await supabase.from("threat_events").insert(event);
  if (error) {
    console.error("[supabase] threat insert failed:", error.message);
  }
}
