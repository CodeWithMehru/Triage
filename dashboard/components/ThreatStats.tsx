"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Code, Key, Radio, Ban, BarChart2, ShieldAlert } from "lucide-react";

interface ThreatStatsProps {
  stats: Record<string, number>;
}

const LABELS: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  SQL_INJECTION: {
    label: "SQL Injection",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/30",
    icon: <Database className="h-3.5 w-3.5 text-rose-400" />,
  },
  XSS: {
    label: "XSS Cross-Site",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    icon: <Code className="h-3.5 w-3.5 text-amber-400" />,
  },
  SENSITIVE_DATA_LEAK: {
    label: "Sensitive Data Leak",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
    icon: <Key className="h-3.5 w-3.5 text-purple-400" />,
  },
  PORT_SCAN: {
    label: "Honeypot Port Scan",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/30",
    icon: <Radio className="h-3.5 w-3.5 text-cyan-400" />,
  },
  AUTO_BAN: {
    label: "SRE Auto-Bans",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/30",
    icon: <Ban className="h-3.5 w-3.5 text-rose-400" />,
  },
};

export function ThreatStats({ stats }: ThreatStatsProps) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <BarChart2 className="h-4 w-4 text-cyan-400" />
          Threat Intel Overview
        </CardTitle>
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">24H Window</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Events Metric Box */}
        <div className="relative overflow-hidden rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-zinc-950 to-zinc-950 p-4 text-center shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2 mb-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              Aggregate Detections
            </span>
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <p className="text-4xl font-extrabold font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">
            {total}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Intercepted Security Probes
          </p>
        </div>

        {/* Threat Categories Breakdown */}
        <div className="space-y-2">
          {Object.entries(LABELS).map(([key, { label, color, bg, icon }]) => {
            const count = stats[key] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div
                key={key}
                className="group relative overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-2.5 transition-all hover:border-zinc-700 hover:bg-zinc-900/70"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-6 w-6 items-center justify-center rounded border ${bg}`}>
                      {icon}
                    </div>
                    <span className={`font-mono text-xs font-medium ${color}`}>{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-200">{count}</span>
                    <span className="font-mono text-[10px] text-zinc-500 w-8 text-right">({pct}%)</span>
                  </div>
                </div>
                {/* Progress Mini Bar */}
                <div className="mt-2 h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
