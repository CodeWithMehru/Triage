"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Shield, Wifi, WifiOff } from "lucide-react";
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
    <div className="flex h-screen flex-col bg-soc-bg">
      <AutoBanBanner alerts={data?.autoBanAlerts ?? []} />

      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-6 py-3">
        <div className="flex items-center gap-4">
          <Shield className="h-6 w-6 text-soc-cyan" />
          <div>
            <h1 className="font-mono text-lg font-bold tracking-[0.15em] text-soc-cyan">
              TRIAGE
            </h1>
            <p className="text-xs text-zinc-500">
              OTel-Powered Blue Team SOC
            </p>
          </div>
          <div className="flex items-center gap-2 pl-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-soc-green opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-soc-green" />
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-soc-green">
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
            Threat Level: {level.toUpperCase()} ({total})
          </Badge>
          <ClearDataButton onCleared={handleCleared} onToast={showToast} />
          <span className="font-mono text-sm text-zinc-400">{clock} UTC+5:30</span>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-12 gap-4 p-4">
        <section className="col-span-12 lg:col-span-3">
          <ThreatStats stats={stats} />
        </section>

        <section className="col-span-12 min-h-0 lg:col-span-6">
          <TerminalLog lines={terminalLines} className="h-full min-h-[400px]" />
        </section>

        <section className="col-span-12 min-h-0 lg:col-span-3">
          <ThreatFeed events={data?.historical ?? []} />
        </section>
      </main>

      <footer className="flex shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-950/90 px-6 py-2 font-mono text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            {data?.status.signoz ? (
              <Wifi className="h-3.5 w-3.5 text-soc-green" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-soc-red" />
            )}
            SigNoz: {data?.status.signoz ? "connected" : "disconnected"}
            {data?.signoz.error && (
              <span className="text-soc-red">
                {" "}
                ({data.signoz.error.slice(0, 60)})
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Supabase: {data?.status.supabase ? "connected" : "not configured"}
          </span>
        </div>
        <span>
          {loading
            ? "Syncing…"
            : `Last sync: ${data?.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString() : "—"}`}
        </span>
      </footer>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
