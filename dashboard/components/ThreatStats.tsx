"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ThreatStatsProps {
  stats: Record<string, number>;
}

const LABELS: Record<string, { label: string; color: string }> = {
  SQL_INJECTION: { label: "SQL Injection", color: "text-soc-red" },
  XSS: { label: "XSS", color: "text-orange-400" },
  SENSITIVE_DATA_LEAK: { label: "Data Leak", color: "text-purple-400" },
  PORT_SCAN: { label: "Port Scan", color: "text-soc-cyan" },
  AUTO_BAN: { label: "Auto-Ban", color: "text-soc-red" },
};

export function ThreatStats({ stats }: ThreatStatsProps) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Threat Stats — 24h</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded border border-zinc-800 bg-zinc-900/50 p-4 text-center">
          <p className="text-3xl font-bold text-soc-red">{total}</p>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Total Events
          </p>
        </div>
        <div className="space-y-2">
          {Object.entries(LABELS).map(([key, { label, color }]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded border border-zinc-800/60 px-3 py-2"
            >
              <span className={`text-sm ${color}`}>{label}</span>
              <span className="font-mono text-zinc-300">{stats[key] ?? 0}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
