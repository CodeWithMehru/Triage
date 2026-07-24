"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, ShieldX, RefreshCw } from "lucide-react";
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
          "inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5",
          "font-mono text-xs font-semibold uppercase tracking-wider text-rose-400",
          "transition-all duration-150 hover:border-rose-500/60 hover:bg-rose-500/20 hover:text-rose-300 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] active:scale-[0.98]"
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Clear Data</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all">
          <div
            className="w-full max-w-md rounded-xl border border-rose-500/40 bg-zinc-950 p-6 shadow-[0_0_50px_rgba(244,63,94,0.2)] animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-dialog-title"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2
                  id="clear-dialog-title"
                  className="font-mono text-sm font-bold uppercase tracking-widest text-rose-400"
                >
                  Confirm Threat Log Wipe
                </h2>
                <p className="font-mono text-[11px] text-zinc-500">
                  Database Administrative Operation
                </p>
              </div>
            </div>
            <p className="mb-6 text-xs leading-relaxed text-zinc-300">
              This action will permanently purge all telemetry records and attack signatures stored in the{" "}
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-cyan-400 border border-zinc-800">
                threat_events
              </code>{" "}
              table. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 font-mono text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border border-rose-500/60 bg-rose-600/20 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-rose-300",
                  "transition-all hover:border-rose-500 hover:bg-rose-600/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]",
                  loading && "cursor-not-allowed opacity-60"
                )}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Purging Data…</span>
                  </>
                ) : (
                  <>
                    <ShieldX className="h-3.5 w-3.5" />
                    <span>Wipe All Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
