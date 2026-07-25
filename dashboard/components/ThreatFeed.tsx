"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ThreatEvent } from "@/lib/supabase";
import { formatTimestamp } from "@/lib/utils";
import { Layers, Sparkles, Shield, Network } from "lucide-react";

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

  const isCritical = event.threat_type === "AUTO_BAN" || event.severity === "CRITICAL";

  return (
    <div className="group rounded-xl border border-white/5 bg-black/30 p-3 font-mono text-[12px] leading-relaxed backdrop-blur-sm transition-all hover:bg-black/50 hover:border-white/10 hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <Badge variant={isCritical ? "critical" : "warn"}>
          {event.threat_type}
        </Badge>
        <span className="tabular-nums text-[10px] font-bold text-white/40 tracking-widest">{formatTimestamp(event.created_at)}</span>
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-1.5 text-white/50">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 shrink-0 text-[var(--neon-cyan)]" />
          <span className="truncate text-[var(--neon-cyan)] font-bold tabular-nums">{traceId.slice(0, 16)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Network className="h-3.5 w-3.5 shrink-0 text-white/40" />
          <span className="font-semibold text-white/30 uppercase text-[10px] tracking-widest">IP</span>
          <span className="text-[var(--neon-amber)] font-bold">{event.source_ip ?? "unknown"}</span>
        </div>
      </div>

      {/* Span detail */}
      {event.ai_analysis ? (
        <div className="mt-3 rounded-lg border border-[var(--neon-purple)]/20 bg-[var(--neon-purple)]/10 px-3 py-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--neon-purple)]">
              <Sparkles className="h-3.5 w-3.5" />
              ai.payload.analysis
            </span>
            <span className="text-[10px] tabular-nums font-bold text-[var(--neon-purple)]/70">{latency}ms</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <p className="text-slate-50 font-medium">
              <span className="text-[var(--neon-purple)] font-bold mr-1">model</span> {model}
            </p>
            <p className="text-slate-50 font-medium">
              <span className="text-[var(--neon-purple)] font-bold mr-1">goal</span> {goal}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-[var(--neon-cyan)]/20 bg-black/40 px-3 py-2">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--neon-cyan)]">
            <Shield className="h-3.5 w-3.5" />
            security.trap
          </span>
          <div className="mt-1.5 space-y-1 text-[11px] text-slate-50 font-medium">
            <p><span className="text-[var(--neon-cyan)] font-bold mr-1">pattern</span> {event.matched_pattern ?? "detected"}</p>
            <p><span className="text-[var(--neon-cyan)] font-bold mr-1">status</span> 403</p>
          </div>
        </div>
      )}

      {event.payload_snippet && (
        <p className="mt-3 truncate text-[11px] text-white/40">
          <span className="text-white/60 font-bold uppercase tracking-widest text-[9px] mr-1">payload</span>
          <code className="text-white/80 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">{event.payload_snippet}</code>
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
        <CardTitle>
          <Layers className="h-4 w-4 text-[var(--neon-cyan)] drop-shadow-[0_0_5px_var(--neon-cyan)]" />
          Trace Feed
        </CardTitle>
        {traceEvents.length > 0 && (
          <span className="font-mono text-[10px] tabular-nums font-bold tracking-widest text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 px-2 py-0.5 rounded-full border border-[var(--neon-cyan)]/30">
            {traceEvents.length}
          </span>
        )}
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {traceEvents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center text-white/30">
            <Layers className="mb-3 h-8 w-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] font-bold">Awaiting OTel spans</p>
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
