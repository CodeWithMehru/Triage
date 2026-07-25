"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Terminal, X, Database, Key, ShieldBan, Play, Loader2, Crosshair } from "lucide-react";

export function RedTeamSimulator() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const triggerAttack = async (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    if (loading) return;
    setLoading(type);
    
    try {
      if (type === "scan") {
        await fetch("/api/simulate-scan", { method: "POST" });
      } else {
        // All attack types go through the same-origin server proxy
        // to avoid CORS blocks from localhost:3000 -> localhost:3001
        await fetch("/api/simulate-attack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
      }
    } catch (err) {
      console.error("Attack failed", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900/80 backdrop-blur-xl ring-1 ring-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-105 hover:bg-slate-800",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <Crosshair className="h-6 w-6 text-cyan-400" />
      </button>

      {/* Floating Glass Panel */}
      <div
        className={cn(
          "fixed bottom-8 right-8 z-50 w-96 font-mono origin-bottom-right transition-all duration-300 ease-in-out",
          open ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-8 pointer-events-none"
        )}
      >
        <div className="overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-2xl ring-1 ring-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 bg-slate-950/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-cyan-500/10 ring-1 ring-cyan-500/30 text-cyan-400">
                <Terminal className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-100">
                Red Team Simulator
              </span>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <p className="text-[11px] leading-relaxed text-slate-300 mb-2 font-sans">
              Execute simulated attacks against the architecture to generate real-time OTel telemetry and trigger automated defenses.
            </p>

            {/* Action 1: SQLi */}
            <div className="rounded-lg bg-slate-950/50 p-3 ring-1 ring-white/5 transition-colors hover:bg-slate-900">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Database className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
                  SQL Injection
                </span>
                <button
                  type="button"
                  onClick={(e) => triggerAttack(e, "sqli")}
                  disabled={!!loading}
                  className="flex items-center gap-1.5 rounded-md bg-[var(--neon-cyan)]/10 px-2 py-1 text-[10px] font-bold tracking-widest text-[var(--neon-cyan)] ring-1 ring-[var(--neon-cyan)]/30 hover:bg-[var(--neon-cyan)]/20 transition-all disabled:opacity-50"
                >
                  {loading === "sqli" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  FIRE
                </button>
              </div>
              <code className="block rounded bg-black/80 p-2 text-[10px] text-slate-400 break-all ring-1 ring-white/5">
                GET /api/search?q=%27%20OR%201%3D1--
              </code>
            </div>

            {/* Action 2: Data Leak */}
            <div className="rounded-lg bg-slate-950/50 p-3 ring-1 ring-white/5 transition-colors hover:bg-slate-900">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Key className="h-3.5 w-3.5 text-[var(--neon-purple)]" />
                  Data Leak
                </span>
                <button
                  type="button"
                  onClick={(e) => triggerAttack(e, "leak")}
                  disabled={!!loading}
                  className="flex items-center gap-1.5 rounded-md bg-[var(--neon-purple)]/10 px-2 py-1 text-[10px] font-bold tracking-widest text-[var(--neon-purple)] ring-1 ring-[var(--neon-purple)]/30 hover:bg-[var(--neon-purple)]/20 transition-all disabled:opacity-50"
                >
                  {loading === "leak" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  FIRE
                </button>
              </div>
              <code className="block rounded bg-black/80 p-2 text-[10px] text-slate-400 break-all ring-1 ring-white/5">
                POST /api/search &#123;"key":"sk-live..."&#125;
              </code>
            </div>

            {/* Action 3: Auto-Ban */}
            <div className="rounded-lg bg-slate-950/50 p-3 ring-1 ring-white/5 transition-colors hover:bg-slate-900">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <ShieldBan className="h-3.5 w-3.5 text-[var(--neon-red)]" />
                  SRE Auto-Ban
                </span>
                <button
                  type="button"
                  onClick={(e) => triggerAttack(e, "autoban")}
                  disabled={!!loading}
                  className="flex items-center gap-1.5 rounded-md bg-[var(--neon-red)]/10 px-2 py-1 text-[10px] font-bold tracking-widest text-[var(--neon-red)] ring-1 ring-[var(--neon-red)]/30 hover:bg-[var(--neon-red)]/20 transition-all disabled:opacity-50"
                >
                  {loading === "autoban" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  STRESS
                </button>
              </div>
              <code className="block rounded bg-black/80 p-2 text-[10px] text-slate-400 break-all ring-1 ring-white/5">
                for i in &#123;1..6&#125;; do curl [SQLi]; sleep 0.3; done
              </code>
            </div>

            {/* Action 4: Port Scan */}
            <div className="rounded-lg bg-slate-950/50 p-3 ring-1 ring-white/5 transition-colors hover:bg-slate-900">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Terminal className="h-3.5 w-3.5 text-[var(--neon-amber)]" />
                  TCP Honeypot Scan
                </span>
                <button
                  type="button"
                  onClick={(e) => triggerAttack(e, "scan")}
                  disabled={!!loading}
                  className="flex items-center gap-1.5 rounded-md bg-[var(--neon-amber)]/10 px-2 py-1 text-[10px] font-bold tracking-widest text-[var(--neon-amber)] ring-1 ring-[var(--neon-amber)]/30 hover:bg-[var(--neon-amber)]/20 transition-all disabled:opacity-50"
                >
                  {loading === "scan" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  PING
                </button>
              </div>
              <code className="block rounded bg-black/80 p-2 text-[10px] text-slate-400 break-all ring-1 ring-white/5">
                nc 127.0.0.1 2222
              </code>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
