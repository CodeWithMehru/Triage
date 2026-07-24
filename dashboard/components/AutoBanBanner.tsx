"use client";

import { ShieldAlert } from "lucide-react";
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
        "flex shrink-0 items-center justify-center gap-3 border-b border-soc-red/60",
        "bg-soc-red/10 px-6 py-2.5 animate-pulse-glow"
      )}
    >
      <ShieldAlert className="h-5 w-5 text-soc-red" />
      <p className="font-mono text-sm font-bold uppercase tracking-wider text-soc-red">
        CRITICAL ALERT: IP Auto-Banned by SRE Sidekick
      </p>
      <span className="font-mono text-xs text-zinc-400">
        {latest.bannedIp} · {latest.attackCount}/{latest.threshold} attacks/min
      </span>
    </div>
  );
}
