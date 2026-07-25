"use client";

import { useEffect, useRef } from "react";
import { cn, formatTimestamp } from "@/lib/utils";
import { Terminal, Sparkles } from "lucide-react";

export interface TerminalLine {
  id: string;
  timestamp: string;
  level: "CRITICAL" | "WARN" | "INFO";
  message: string;
  source?: string;
  aiAnalysis?: string | null;
}

interface TerminalLogProps {
  lines: TerminalLine[];
  className?: string;
}

const LEVEL_COLOR: Record<TerminalLine["level"], string> = {
  CRITICAL: "text-[var(--neon-red)]",
  WARN: "text-[var(--neon-amber)]",
  INFO: "text-[var(--neon-cyan)]",
};

export function TerminalLog({ lines, className }: TerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayLines = lines.slice(0, 500);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const frame = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [displayLines.length]);

  return (
    <div
      className={cn(
        "glass-panel flex h-full flex-col overflow-hidden rounded-xl font-mono text-[12px] shadow-[0_0_30px_rgba(0,0,0,0.8)] relative z-10",
        className
      )}
    >
      {/* macOS Title Bar (Glass Edition) */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56] shadow-[0_0_8px_#ff5f56]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e] shadow-[0_0_8px_#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f] shadow-[0_0_8px_#27c93f]" />
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <Terminal className="h-4 w-4" />
            <span className="text-xs font-bold tracking-widest uppercase">triage@soc — live telemetry</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {displayLines.length > 0 && (
            <span className="text-[10px] tabular-nums text-white/50 uppercase tracking-widest font-bold">
              {displayLines.length} events
            </span>
          )}
          <span className="terminal-blink font-black text-lg text-[var(--neon-cyan)] drop-shadow-[0_0_8px_var(--neon-cyan)]">▊</span>
        </div>
      </div>

      {/* Log Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 leading-[1.75]"
      >
        {displayLines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white/30">
            <Terminal className="h-8 w-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold">
              Awaiting telemetry — trigger attacks to populate
            </span>
          </div>
        ) : (
          displayLines.map((line) => (
            <div key={line.id} className="animate-fade-in py-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-white/40 tabular-nums select-none font-bold">
                  [{formatTimestamp(line.timestamp)}]
                </span>
                <span className={cn("font-black tracking-wider uppercase", LEVEL_COLOR[line.level])}>
                  {line.level}
                </span>
                {line.source && (
                  <span className="text-[var(--neon-purple)] font-bold drop-shadow-[0_0_5px_var(--neon-purple)] uppercase text-[10px] tracking-wider bg-[var(--neon-purple)]/10 px-1 rounded-sm">
                    {line.source}
                  </span>
                )}
                <span className="text-white/90 drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">{line.message}</span>
              </div>

              {line.aiAnalysis && (
                <div className="mt-2 mb-2 ml-4 flex items-start gap-2.5 rounded-lg border border-[var(--neon-pink)]/20 bg-[var(--neon-pink)]/10 px-3 py-2 text-[12px] backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--neon-pink)]/50" />
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--neon-pink)]" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--neon-pink)]">
                      AI Threat Analysis
                    </span>
                    <p className="mt-1 font-sans text-[12px] leading-relaxed text-slate-50 font-medium">
                      {line.aiAnalysis}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
