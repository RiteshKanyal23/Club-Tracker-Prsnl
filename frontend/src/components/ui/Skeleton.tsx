import { cn } from "../../utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-white/10", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex-1 min-h-0 flex items-end gap-2 px-2 pb-2", className)}>
      {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
        <div key={i} className="flex-1 animate-pulse rounded-lg bg-white/10" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
