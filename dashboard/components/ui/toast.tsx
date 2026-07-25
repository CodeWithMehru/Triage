"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error";
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      className={cn(
        "glass-panel fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 font-mono text-sm shadow-2xl animate-fade-in",
        toast.type === "success"
          ? "border-[var(--neon-green)]/30 text-[var(--neon-green)] shadow-[0_0_30px_rgba(57,255,20,0.15)]"
          : "border-[var(--neon-red)]/30 text-[var(--neon-red)] shadow-[0_0_30px_rgba(255,7,58,0.15)]"
      )}
    >
      {toast.type === "success" ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 drop-shadow-[0_0_8px_var(--neon-green)]" />
      ) : (
        <XCircle className="h-5 w-5 shrink-0 drop-shadow-[0_0_8px_var(--neon-red)]" />
      )}
      <span className="font-semibold drop-shadow-[0_0_4px_currentColor]">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-2 text-white/50 transition-colors hover:text-white"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
