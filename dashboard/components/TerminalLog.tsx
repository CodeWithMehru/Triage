"use client";

import { useEffect, useRef } from "react";
import { cn, formatTimestamp } from "@/lib/utils";

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
  CRITICAL: "text-soc-red",
  WARN: "text-yellow-400",
  INFO: "text-soc-cyan",
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
        "relative flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-black/60 font-mono text-xs",
        className
      )}
    >
      <div className="scanline pointer-events-none absolute inset-0 z-10 opacity-[0.04]" />
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-soc-red" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-soc-green" />
        <span className="ml-2 text-zinc-500">sentinel@soc — live threat feed</span>
        <span className="ml-auto terminal-blink text-soc-cyan">█</span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 leading-relaxed"
      >
        {displayLines.length === 0 ? (
          <p className="text-zinc-600">
            [INFO] Awaiting telemetry… trigger attacks against the trap API or honeypot.
          </p>
        ) : (
          displayLines.map((line) => (
            <div key={line.id} className="mb-1 animate-fade-in">
              <span className="text-zinc-600">
                [{formatTimestamp(line.timestamp)}]
              </span>{" "}
              <span className={LEVEL_STYLES[line.level]}>
                [{line.level}]
              </span>{" "}
              {line.source && (
                <span className="text-purple-400">[{line.source}] </span>
              )}
              <span className="text-zinc-300">{line.message}</span>
              {line.aiAnalysis && (
                <span className="mt-0.5 block pl-4 text-purple-400">
                  ↳ AI: {line.aiAnalysis}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
