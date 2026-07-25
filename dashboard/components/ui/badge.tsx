import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "critical" | "warn" | "info" | "ok";
}

export function Badge({ className, variant = "info", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.1em] leading-none transition-all duration-300",
        variant === "critical" &&
          "bg-[var(--neon-red)]/15 text-[var(--neon-red)] ring-1 ring-inset ring-[var(--neon-red)]/50",
        variant === "warn" &&
          "bg-[var(--neon-amber)]/15 text-[var(--neon-amber)] ring-1 ring-inset ring-[var(--neon-amber)]/50",
        variant === "info" &&
          "bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)] ring-1 ring-inset ring-[var(--neon-cyan)]/50",
        variant === "ok" &&
          "bg-[var(--neon-green)]/15 text-[var(--neon-green)] ring-1 ring-inset ring-[var(--neon-green)]/50",
        className
      )}
      {...props}
    />
  );
}
