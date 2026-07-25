"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Database, Code, KeyRound, Radio, ShieldBan } from "lucide-react";

interface ThreatStatsProps {
  stats: Record<string, number>;
}

const CATEGORIES: Record<string, { label: string; colorVar: string; icon: React.ReactNode }> = {
  SQL_INJECTION: {
    label: "SQLi",
    colorVar: "--neon-red",
    icon: <Database className="h-4 w-4" />,
  },
  XSS: {
    label: "XSS",
    colorVar: "--neon-amber",
    icon: <Code className="h-4 w-4" />,
  },
  SENSITIVE_DATA_LEAK: {
    label: "Data Leak",
    colorVar: "--neon-purple",
    icon: <KeyRound className="h-4 w-4" />,
  },
  PORT_SCAN: {
    label: "Port Scan",
    colorVar: "--neon-cyan",
    icon: <Radio className="h-4 w-4" />,
  },
  AUTO_BAN: {
    label: "Auto-Ban",
    colorVar: "--neon-red",
    icon: <ShieldBan className="h-4 w-4" />,
  },
};

export function ThreatStats({ stats }: ThreatStatsProps) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>
          <BarChart3 className="h-4 w-4 text-[var(--neon-cyan)] drop-shadow-[0_0_5px_var(--neon-cyan)]" />
          Threat Summary
        </CardTitle>
        <span className="font-mono text-[10px] tabular-nums font-bold tracking-widest text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 px-2 py-0.5 rounded-full border border-[var(--neon-cyan)]/30">24H</span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {/* Total metric */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--neon-cyan)]/10 blur-[50px] pointer-events-none" />
          <div className="flex items-baseline justify-between relative z-10">
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/60">
              Total Events
            </span>
            {total > 0 && (
              <span className="h-2 w-2 rounded-full bg-[var(--neon-red)] shadow-[0_0_10px_var(--neon-red)] animate-pulse-glow" />
            )}
          </div>
          <p className="mt-2 font-mono text-5xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] relative z-10">
            {total}
          </p>
        </div>

        {/* Category rows */}
        <div className="flex flex-col gap-2 relative z-10">
          {Object.entries(CATEGORIES).map(([key, { label, colorVar, icon }]) => {
            const count = stats[key] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div
                key={key}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/10"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)] group-hover:shadow-none"
                  style={{
                    color: `var(${colorVar})`,
                    backgroundColor: `color-mix(in srgb, var(${colorVar}) 15%, transparent)`,
                    borderColor: `color-mix(in srgb, var(${colorVar}) 30%, transparent)`,
                    filter: `drop-shadow(0 0 5px var(${colorVar}))`,
                  }}
                >
                  {icon}
                </div>
                <div className="flex flex-1 items-center justify-between gap-2">
                  <span className="font-mono text-[13px] font-bold tracking-wider text-white/80 group-hover:text-white transition-colors">
                    {label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black tabular-nums text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                      {count}
                    </span>
                    {total > 0 && (
                      <span className="w-8 text-right font-mono text-[10px] tabular-nums font-bold text-white/40">
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>
                {/* Neon progress indicator */}
                <div className="hidden lg:block h-1.5 w-16 overflow-hidden rounded-full bg-black/60 border border-white/5 shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: `var(${colorVar})`,
                      boxShadow: `0 0 8px var(${colorVar})`,
                    }}
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
