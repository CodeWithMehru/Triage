import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("running-border-wrapper rounded-xl", className)}
      {...props}
    >
      <div className="flex h-full w-full flex-col">
        {children}
      </div>
    </div>
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-header flex items-center justify-between px-4 py-3",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.15em] text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 p-3.5 relative z-10", className)} {...props} />;
}
