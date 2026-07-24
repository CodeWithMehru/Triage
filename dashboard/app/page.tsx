"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Shield, Wifi, WifiOff, Clock, RefreshCw, Database } from "lucide-react";
import { TerminalLog, type TerminalLine } from "@/components/TerminalLog";
import { ThreatStats } from "@/components/ThreatStats";
import { ThreatFeed } from "@/components/ThreatFeed";
import { ClearDataButton } from "@/components/ClearDataButton";
import { AutoBanBanner } from "@/components/AutoBanBanner";
import { Toast, type ToastMessage } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import type { SigNozSpan } from "@/lib/signoz";
import type { AutoBanAlert, ThreatEvent } from "@/lib/supabase";

interface ThreatsResponse {
  historical: ThreatEvent[];
  stats: Record<string, number>;
  autoBanAlerts: AutoBanAlert[];
  signoz: {
    spans: SigNozSpan[];
    connected: boolean;
    error?: string;
  };
  status: {
    supabase: boolean;
    signoz: boolean;
  };
  fetchedAt: string;
}

const EMPTY_RESPONSE: ThreatsResponse = {
  historical: [],
  stats: {},
  autoBanAlerts: [],
  signoz: { spans: [], connected: false },
  status: { supabase: false, signoz: false },
  fetchedAt: new Date().toISOString(),
};

function threatLevel(stats: Record<string, number>): "critical" | "warn" | "ok" {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  if (total >= 10) return "critical";
  if (total >= 1) return "warn";
  return "ok";
}

function eventToLine(event: ThreatEvent): TerminalLine {
  const payloadInfo = event.payload_snippet
    ? ` | payload: ${event.payload_snippet}`
    : "";
  return {
    id: event.id,
    timestamp: event.created_at,
    level:
      event.threat_type === "AUTO_BAN" || event.severity === "CRITICAL"
        ? "CRITICAL"
        : "WARN",
    source: event.source,
    message: `${event.threat_type} from ${event.source_ip ?? "unknown"} — ${event.matched_pattern ?? "detected"}${payloadInfo}`,
    aiAnalysis: event.ai_analysis,
  };
}

function spanToLine(span: SigNozSpan): TerminalLine {
  return {
    id: span.id,
    timestamp: span.timestamp,
    level: "CRITICAL",
    source: "signoz",
    message: `[LIVE] ${span.threatType} — ${span.serviceName} — IP ${span.sourceIp} — HTTP ${span.statusCode}`,
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<ThreatsResponse | null>(null);
  const [clock, setClock] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const fetchThreats = useCallback(async () => {
    try {
      const res = await fetch("/api/threats", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as ThreatsResponse;
        setData(json);
      }
    } catch {
      /* keep last known data */
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCleared = useCallback(() => {
    setData(EMPTY_RESPONSE);
    void fetchThreats();
  }, [fetchThreats]);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ id: Date.now().toString(), type, message });
    },
    []
  );

  useEffect(() => {
    void fetchThreats();
    const poll = setInterval(fetchThreats, 5000);
    return () => clearInterval(poll);
  }, [fetchThreats]);

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const terminalLines = useMemo(() => {
    const historical = (data?.historical ?? []).map(eventToLine);
    const live = (data?.signoz.spans ?? []).map(spanToLine);
    const merged = [...live, ...historical];
    merged.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return merged.slice(0, 500);
  }, [data]);

  const stats = data?.stats ?? {};
  const level = threatLevel(stats);
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-screen flex-col bg-soc-bg text-zinc-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      <AutoBanBanner alerts={data?.autoBanAlerts ?? []} />

      {/* Top Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-6 py-3 shadow-md backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-indigo-500/20 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300">
                TRIAGE
              </h1>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.2 font-mono text-[9px] font-bold text-cyan-400">
                SOC v2.4
              </span>
            </div>
            <p className="font-mono text-[11px] text-zinc-400">
              OTel-Powered Blue Team Security Operations
            </p>
          </div>
          <div className="hidden items-center gap-2 border-l border-zinc-800/80 pl-5 sm:flex">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
              Active Radar
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={
              level === "critical"
                ? "critical"
                : level === "warn"
                  ? "warn"
                  : "ok"
            }
          >
            Level: {level.toUpperCase()} ({total})
          </Badge>
          <ClearDataButton onCleared={handleCleared} onToast={showToast} />
          <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 font-mono text-xs text-zinc-300">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>{clock}</span>
            <span className="text-zinc-500 text-[10px]">UTC+5:30</span>
          </div>
        </div>
      </header>

      {/* Main Grid: 3-Column Layout Preserved */}
      <main className="grid min-h-0 flex-1 grid-cols-12 gap-4 p-4">
        <section className="col-span-12 min-h-0 lg:col-span-3">
          <ThreatStats stats={stats} />
        </section>

        <section className="col-span-12 min-h-0 lg:col-span-6">
          <TerminalLog lines={terminalLines} className="h-full min-h-[400px]" />
        </section>

        <section className="col-span-12 min-h-0 lg:col-span-3">
          <ThreatFeed events={data?.historical ?? []} />
        </section>
      </main>

      {/* Footer Bar */}
      <footer className="flex shrink-0 items-center justify-between border-t border-zinc-800/80 bg-zinc-950/90 px-6 py-2.5 font-mono text-xs text-zinc-400 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            {data?.status.signoz ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-rose-400" />
            )}
            <span className="text-zinc-400">SigNoz Collector:</span>
            <span className={data?.status.signoz ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
              {data?.status.signoz ? "Online" : "Disconnected"}
            </span>
            {data?.signoz.error && (
              <span className="text-rose-400 text-[10px]">
                ({data.signoz.error.slice(0, 50)})
              </span>
            )}
          </span>
          <span className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-zinc-400">Supabase DB:</span>
            <span className={data?.status.supabase ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
              {data?.status.supabase ? "Connected" : "Unconfigured"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          <span>
            {loading
              ? "Syncing telemetry…"
              : `Synced ${data?.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString() : "—"}`}
          </span>
        </div>
      </footer>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
