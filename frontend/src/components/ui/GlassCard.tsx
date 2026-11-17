import { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

interface GlassCardProps extends PropsWithChildren {
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 relative overflow-hidden transition-all duration-300",
        hover && "hover:shadow-neon hover:border-accent/30 hover:-translate-y-0.5",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-60" />
      <div className="relative z-10 h-full flex flex-col min-h-0">{children}</div>
    </div>
  );
}
