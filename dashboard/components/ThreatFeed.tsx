"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ThreatEvent } from "@/lib/supabase";
import { formatTimestamp } from "@/lib/utils";
import { Layers, Sparkles, Shield, Cpu, Network, CornerDownRight } from "lucide-react";

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
  const model = getMeta(event, "llm_model", "llama-3.1-8b-instant");
  const latency = getMeta(event, "llm_latency_ms", 42);
  const goal = event.ai_analysis ?? "Goal: Unknown";

  return (
    <div className="group rounded-xl border border-zinc-800/80 bg-zinc-950/90 p-3 font-mono text-[11px] leading-relaxed transition-all hover:border-zinc-700/80 hover:shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-zinc-900 pb-2">
        <Badge variant={event.threat_type === "AUTO_BAN" || event.severity === "CRITICAL" ? "critical" : "warn"}>
          {event.threat_type}
        </Badge>
        <span className="text-[10px] text-zinc-500">{formatTimestamp(event.created_at)}</span>
      </div>

      <div className="space-y-1 text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-cyan-400 shrink-0" />
          <span className="text-zinc-500">Trace:</span>
          <span className="text-cyan-400 font-semibold truncate tracking-tight">{traceId.slice(0, 16)}…</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Network className="h-3 w-3 text-zinc-500 shrink-0" />
          <span className="text-zinc-500">IP:</span>
          <span className="text-amber-400 font-medium">{event.source_ip ?? "unknown"}</span>
        </div>
      </div>

      {event.ai_analysis ? (
        <div className="mt-2.5 rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-purple-900/10 to-zinc-950 p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-purple-300">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              Span: ai.payload.analysis
            </span>
            <span className="rounded bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.2 text-[9px] text-purple-300">
              {latency}ms
            </span>
          </div>
          <div className="space-y-1 font-mono text-[10px]">
            <p className="text-zinc-400">
              <span className="text-purple-400">llm.model</span> = <span className="text-zinc-300">"{model}"</span>
            </p>
            <p className="text-zinc-400 leading-normal">
              <span className="text-purple-400">threat.goal</span> = <span className="text-zinc-300">"{goal}"</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-2.5 rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300 mb-1">
            <Shield className="h-3.5 w-3.5 text-cyan-400" />
            Span: security.trap
          </div>
          <div className="space-y-0.5 font-mono text-[10px] text-zinc-400">
            <p><span className="text-cyan-400">pattern</span> = "{event.matched_pattern ?? "detected"}"</p>
            <p><span className="text-cyan-400">status</span> = 403 Forbidden</p>
          </div>
        </div>
      )}

      {event.payload_snippet && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-500 truncate">
          <CornerDownRight className="h-3 w-3 shrink-0 text-zinc-600" />
          <span className="truncate">Payload: <code className="text-zinc-400">{event.payload_snippet}</code></span>
        </div>
      )}
    </div>
  );
}

export function ThreatFeed({ events }: ThreatFeedProps) {
  const traceEvents = events.filter((e) => e.threat_type !== "AUTO_BAN");

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>
          <Cpu className="h-4 w-4 text-cyan-400" />
          SigNoz Live Traces
        </CardTitle>
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-400">
          {traceEvents.length} Active
        </span>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
        {traceEvents.length === 0 ? (
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-6 text-center font-mono text-xs text-zinc-500">
            <Layers className="mx-auto h-8 w-8 text-zinc-700 mb-2 animate-pulse" />
            <p className="text-cyan-400 font-semibold">// awaiting OTel spans…</p>
            <p className="mt-1 text-[11px] text-zinc-500">Run demo attacks against the trap API to stream live SigNoz spans.</p>
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
