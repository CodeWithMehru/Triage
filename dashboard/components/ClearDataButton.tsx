"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClearDataButtonProps {
  onCleared: () => void;
  onToast: (message: string, type: "success" | "error") => void;
}

export function ClearDataButton({ onCleared, onToast }: ClearDataButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClear = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/threats/clear", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        onToast(json.error ?? "Failed to clear data", "error");
        return;
      }

      onToast("Threat data wiped successfully", "success");
      setOpen(false);
      onCleared();
    } catch {
      onToast("Failed to clear threat data", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-3 py-1.5",
          "font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--neon-red)]",
          "ring-1 ring-inset ring-[var(--neon-red)]/40 bg-[var(--neon-red)]/10 transition-all duration-300",
          "hover:bg-[var(--neon-red)]/20 hover:ring-[var(--neon-red)]/70 hover:shadow-[0_0_15px_rgba(255,7,58,0.4)]"
        )}
      >
        <Trash2 className="h-3.5 w-3.5 drop-shadow-[0_0_5px_var(--neon-red)]" />
        <span className="drop-shadow-[0_0_5px_var(--neon-red)]">Clear</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div
            className="glass-panel w-full max-w-md rounded-2xl border border-[var(--neon-red)]/30 p-6 shadow-[0_0_50px_rgba(255,7,58,0.15)] animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-dialog-title"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--neon-red)]/15 border border-[var(--neon-red)]/30 text-[var(--neon-red)] shadow-[0_0_15px_rgba(255,7,58,0.2)]">
                <AlertTriangle className="h-5 w-5 drop-shadow-[0_0_5px_var(--neon-red)]" />
              </div>
              <div>
                <h2
                  id="clear-dialog-title"
                  className="font-mono text-sm font-black uppercase tracking-widest text-[var(--neon-red)] drop-shadow-[0_0_5px_var(--neon-red)]"
                >
                  Purge Threat Data
                </h2>
                <p className="font-mono text-[11px] text-white/50 mt-1">
                  Destructive database operation
                </p>
              </div>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-white/70">
              All records in{" "}
              <code className="rounded bg-black/40 border border-white/10 px-1.5 py-0.5 font-mono text-[12px] text-[var(--neon-cyan)] drop-shadow-[0_0_2px_var(--neon-cyan)]">
                threat_events
              </code>{" "}
              will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-lg px-4 py-2 font-mono text-xs font-bold text-white/60 ring-1 ring-inset ring-white/20 transition-all hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg bg-[var(--neon-red)]/20 px-4 py-2 font-mono text-xs font-black uppercase tracking-wider text-[var(--neon-red)] ring-1 ring-inset ring-[var(--neon-red)]/60 shadow-[0_0_20px_rgba(255,7,58,0.4)]",
                  "transition-all hover:bg-[var(--neon-red)]/40 hover:shadow-[0_0_30px_rgba(255,7,58,0.6)]",
                  loading && "cursor-not-allowed opacity-60"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Purging…
                  </>
                ) : (
                  "Confirm Purge"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
