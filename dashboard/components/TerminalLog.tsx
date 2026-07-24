"use client";

import { useEffect, useRef } from "react";
import { cn, formatTimestamp } from "@/lib/utils";
import { Terminal, Sparkles, Activity } from "lucide-react";

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

const LEVEL_STYLES: Record<TerminalLine["level"], string> = {
  CRITICAL: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  WARN: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  INFO: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
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
        "relative flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-950/90 font-mono text-xs shadow-2xl backdrop-blur-md",
        className
      )}
    >
      {/* macOS Style 3-Dot Title Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.5)] transition-transform hover:scale-110 cursor-pointer" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-transform hover:scale-110 cursor-pointer" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-transform hover:scale-110 cursor-pointer" />
          </div>
          <div className="ml-3 flex items-center gap-2 border-l border-zinc-800 pl-3 text-zinc-400">
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-zinc-300">triage@soc — live telemetry stream</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
            <Activity className="h-3 w-3 animate-pulse" />
            Active Feed
          </span>
          <span className="terminal-blink text-cyan-400 font-bold">█</span>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 leading-relaxed space-y-2"
      >
        {displayLines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-zinc-600 space-y-2">
            <Terminal className="h-8 w-8 text-zinc-700 animate-pulse" />
            <p className="font-mono text-xs text-zinc-500">
              [INFO] Awaiting telemetry stream… trigger test attacks against the trap API or honeypot.
            </p>
          </div>
        ) : (
          displayLines.map((line) => (
            <div key={line.id} className="animate-fade-in rounded-md border border-zinc-900/60 bg-zinc-950/60 p-2 transition-colors hover:border-zinc-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-zinc-500">
                  [{formatTimestamp(line.timestamp)}]
                </span>
                <span className={cn("rounded border px-1.5 py-0.2 text-[10px] font-bold uppercase", LEVEL_STYLES[line.level])}>
                  {line.level}
                </span>
                {line.source && (
                  <span className="rounded bg-purple-950/60 border border-purple-800/40 px-1.5 py-0.2 text-[10px] text-purple-300">
                    {line.source}
                  </span>
                )}
                <span className="text-zinc-200 font-sans text-xs">{line.message}</span>
              </div>

              {line.aiAnalysis && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-zinc-950 p-2.5 text-xs text-purple-200">
                  <Sparkles className="h-4 w-4 shrink-0 text-purple-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-purple-300 text-[11px] uppercase tracking-wider block mb-0.5">
                      Groq LLM Threat Reasoning
                    </span>
                    <p className="font-sans text-zinc-300 leading-normal">
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
