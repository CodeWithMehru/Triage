"use client";

import { ShieldAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutoBanAlert {
  id: string;
  bannedIp: string;
  attackCount: number;
  threshold: number;
  timestamp: string;
}

interface AutoBanBannerProps {
  alerts: AutoBanAlert[];
}

export function AutoBanBanner({ alerts }: AutoBanBannerProps) {
  if (alerts.length === 0) return null;

  const latest = alerts[0];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-rose-500/40",
        "bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-rose-950/80 px-6 py-2.5 shadow-lg backdrop-blur-md"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-400">
            CRITICAL INCIDENT RESPONSE: IP AUTO-BANNED BY SRE SIDEKICK
          </span>
          <p className="font-mono text-[11px] text-zinc-400">
            Target IP: <span className="font-semibold text-rose-300">{latest.bannedIp}</span> · Attack Burst Rate: <span className="text-amber-300 font-semibold">{latest.attackCount}</span> / {latest.threshold} req/min
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-mono text-[11px] font-medium text-rose-300">
        <Zap className="h-3 w-3 text-rose-400" />
        <span>Perimeter Policy Enforced</span>
      </div>
    </div>
  );
}
