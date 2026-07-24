import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "critical" | "warn" | "info" | "ok";
}

export function Badge({ className, variant = "info", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono uppercase tracking-wider",
        variant === "critical" &&
          "border-soc-red/60 bg-soc-red/10 text-soc-red shadow-[0_0_8px_rgba(239,68,68,0.4)]",
        variant === "warn" &&
          "border-yellow-500/60 bg-yellow-500/10 text-yellow-400",
        variant === "info" &&
          "border-soc-cyan/60 bg-soc-cyan/10 text-soc-cyan shadow-[0_0_8px_rgba(34,211,238,0.3)]",
        variant === "ok" &&
          "border-soc-green/60 bg-soc-green/10 text-soc-green",
        className
      )}
      {...props}
    />
  );
}
