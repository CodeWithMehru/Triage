"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Shield, Wifi, WifiOff, Clock, RefreshCw, Database } from "lucide-react";
import { TerminalLog, type TerminalLine } from "@/components/TerminalLog";
import { ThreatStats } from "@/components/ThreatStats";
import { ThreatFeed } from "@/components/ThreatFeed";
import { ClearDataButton } from "@/components/ClearDataButton";
import { AutoBanBanner } from "@/components/AutoBanBanner";
import { Toast, type ToastMessage } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { RedTeamSimulator } from "@/components/RedTeamSimulator";
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
    <div className="flex h-full flex-col bg-transparent text-[var(--foreground)] antialiased">
      <AutoBanBanner alerts={data?.autoBanAlerts ?? []} />

      {/* ─── Header ─── */}
      <header className="glass-header flex shrink-0 items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Logo with neon cyan glow */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--neon-cyan)]/30 bg-[var(--neon-cyan)]/10 shadow-[0_0_15px_rgba(0,255,255,0.2)]">
            <Shield className="h-5 w-5 text-[var(--neon-cyan)]" />
          </div>

          <div className="flex items-baseline gap-3">
            <h1 className="neon-text-logo font-mono text-lg font-black tracking-[0.2em]">
              TRIAGE
            </h1>
            <span className="hidden sm:inline font-mono text-[11px] text-[var(--foreground)] opacity-70">
              Blue Team SOC
            </span>
          </div>

          {/* Live indicator (Neon Green) */}
          <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--neon-green)] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--neon-green)] shadow-[0_0_8px_var(--neon-green)]" />
            </span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--neon-green)]">
              Live
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge
            variant={
              level === "critical"
                ? "critical"
                : level === "warn"
                  ? "warn"
                  : "ok"
            }
          >
            {level.toUpperCase()} · {total}
          </Badge>
          <ClearDataButton onCleared={handleCleared} onToast={showToast} />
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 font-mono text-[12px] tabular-nums text-white/80 backdrop-blur-md">
            <Clock className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
            {clock}
          </div>
        </div>
      </header>

      {/* ─── 3-Column Grid ─── */}
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

      <footer className="glass-header flex shrink-0 items-center justify-between border-t border-white/10 px-6 py-2 font-mono text-[11px] text-white/60">
        <div className="flex items-center gap-6">
          <span className="inline-flex items-center gap-2">
            {data?.status.signoz ? (
              <Wifi className="h-3.5 w-3.5 text-[var(--neon-green)]" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-[var(--neon-red)]" />
            )}
            SigNoz{" "}
            <span className={data?.status.signoz ? "text-[var(--neon-green)] font-semibold" : "text-[var(--neon-red)] font-semibold"}>
              {data?.status.signoz ? "ONLINE" : "OFFLINE"}
            </span>
            {data?.signoz.error && (
              <span className="text-[var(--neon-red)]">({data.signoz.error.slice(0, 40)})</span>
            )}
          </span>
          <span className="inline-flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
            Supabase{" "}
            <span className={data?.status.supabase ? "text-[var(--neon-green)] font-semibold" : "text-[var(--neon-amber)] font-semibold"}>
              {data?.status.supabase ? "CONNECTED" : "UNCONFIGURED"}
            </span>
          </span>
        </div>
        <span className="inline-flex items-center gap-2 tabular-nums">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-[var(--neon-cyan)]" : ""}`} />
          {loading
            ? "SYNCING…"
            : `SYNCED ${data?.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString() : "—"}`}
        </span>
      </footer>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <RedTeamSimulator />
    </div>
  );
}
