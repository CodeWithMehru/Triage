"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ThreatEvent } from "@/lib/supabase";
import { formatTimestamp } from "@/lib/utils";

interface ThreatFeedProps {
  events: ThreatEvent[];
}

function eventToTraceId(id: string): string {
  return id.replace(/-/g, "").slice(0, 32);
}

function getMeta(event: ThreatEvent, key: string, fallback: string | number): string | number {
  const meta = event.metadata ?? {};
  const val = meta[key];
  if (val === undefined || val === null) return fallback;
  return typeof val === "number" ? val : String(val);
}

function TraceBlock({ event }: { event: ThreatEvent }) {
  const traceId = eventToTraceId(event.id);
  const model = getMeta(event, "llm_model", "llama3-8b-8192");
  const latency = getMeta(event, "llm_latency_ms", 42);
  const goal = event.ai_analysis ?? "Goal: Unknown";

  return (
    <div className="rounded border border-zinc-800 bg-black/80 p-3 font-mono text-[11px] leading-relaxed">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge variant="critical">{event.threat_type}</Badge>
        <span className="text-zinc-600">{formatTimestamp(event.created_at)}</span>
      </div>

      <p className="text-zinc-500">
        Trace ID: <span className="text-soc-cyan">{traceId}</span>
      </p>
      <p className="text-zinc-500">
        Service: <span className="text-zinc-300">sentinel-trap-api</span>
      </p>
      <p className="text-zinc-500">
        IP: <span className="text-yellow-400">{event.source_ip ?? "unknown"}</span>
      </p>

      {event.ai_analysis ? (
        <div className="mt-2 rounded border border-purple-900/40 bg-purple-950/20 p-2">
          <p className="text-purple-400">Span: ai.payload.analysis</p>
          <pre className="mt-1 whitespace-pre-wrap break-all text-zinc-400">
{`Attributes: {
  "llm.model": "${model}",
  "llm.latency": "${latency}ms",
  "threat.goal": "${goal}"
}`}
          </pre>
        </div>
      ) : (
        <div className="mt-2 rounded border border-zinc-800 bg-zinc-900/40 p-2">
          <p className="text-zinc-500">Span: security.trap</p>
          <pre className="mt-1 whitespace-pre-wrap break-all text-zinc-500">
{`Attributes: {
  "security.threat_type": "${event.threat_type}",
  "security.matched_pattern": "${event.matched_pattern ?? "unknown"}",
  "http.status_code": 403
}`}
          </pre>
        </div>
      )}

      {event.payload_snippet && (
        <p className="mt-2 truncate text-zinc-600">
          Payload: {event.payload_snippet}
        </p>
      )}
    </div>
  );
}

export function ThreatFeed({ events }: ThreatFeedProps) {
  const traceEvents = events.filter((e) => e.threat_type !== "AUTO_BAN");

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>SigNoz Live Traces</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {traceEvents.length === 0 ? (
          <div className="rounded border border-zinc-800 bg-black/60 p-4 font-mono text-xs text-zinc-600">
            <p className="text-soc-cyan">// awaiting telemetry…</p>
            <p className="mt-1">Run demo attacks against the trap API to populate traces.</p>
          </div>
        ) : (
          traceEvents.map((event) => (
            <TraceBlock key={event.id} event={event} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
