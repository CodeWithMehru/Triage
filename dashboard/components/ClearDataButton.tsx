"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
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
          "flex items-center gap-2 rounded border border-soc-red/40 bg-soc-red/5 px-3 py-1.5",
          "font-mono text-xs uppercase tracking-wider text-soc-red",
          "transition-all hover:border-soc-red hover:bg-soc-red/15 hover:shadow-[0_0_16px_rgba(239,68,68,0.45)]"
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Clear Data
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-lg border border-soc-red/40 bg-zinc-950 p-6 shadow-[0_0_40px_rgba(239,68,68,0.15)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-dialog-title"
          >
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-soc-red" />
              <h2
                id="clear-dialog-title"
                className="font-mono text-sm font-bold uppercase tracking-widest text-soc-red"
              >
                Confirm Data Wipe
              </h2>
            </div>
            <p className="mb-6 text-sm text-zinc-400">
              This will permanently delete all records in the{" "}
              <code className="text-soc-cyan">threat_events</code> table. This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded border border-zinc-700 px-4 py-2 font-mono text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className={cn(
                  "rounded border border-soc-red bg-soc-red/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-soc-red",
                  "hover:bg-soc-red/20 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)]",
                  loading && "cursor-not-allowed opacity-60"
                )}
              >
                {loading ? "Wiping…" : "Wipe All Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
