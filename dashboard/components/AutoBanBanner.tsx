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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div
        className={cn(
          "flex items-center gap-4 rounded-full border border-[var(--neon-red)]/30",
          "bg-black/60 px-6 py-2.5 backdrop-blur-xl shadow-[0_8px_32px_rgba(255,7,58,0.25)]"
        )}
      >
        <ShieldAlert className="h-4 w-4 shrink-0 text-[var(--neon-red)] animate-pulse-glow drop-shadow-[0_0_8px_var(--neon-red)]" />
        <div className="flex items-center gap-3 font-mono text-sm">
          <span className="font-black uppercase tracking-wider text-[var(--neon-red)] drop-shadow-[0_0_4px_var(--neon-red)]">
            SRE Auto-Ban Triggered
          </span>
          <span className="text-white/60 mx-2 text-xs">|</span>
          <span className="text-white/80 text-xs">
            IP <span className="font-bold text-white tracking-widest">{latest.bannedIp}</span> blocked
            — <span className="text-[var(--neon-red)]">{latest.attackCount}/{latest.threshold}</span> attacks/min
          </span>
        </div>
      </div>
    </div>
  );
}
