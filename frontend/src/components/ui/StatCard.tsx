import { ReactNode } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { TiltCard } from "./TiltCard";
import { AnimatedCounter } from "./AnimatedCounter";
import { cn } from "../../utils/cn";

export function StatCard({ title, value, icon, accent = "from-accent to-violet", subtitle }: { title: string; value: number | string; icon: ReactNode; accent?: string; subtitle?: string }) {
  const numeric = typeof value === "number";
  return (
    <TiltCard>
      <GlassCard className="h-full overflow-hidden">
        <motion.div
          className={cn("absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-30 bg-gradient-to-br", accent)}
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-slate-400 mb-1">{title}</div>
            <div className="text-3xl font-bold text-white">
              {numeric ? <AnimatedCounter value={value as number} /> : value}
            </div>
            {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
          </div>
          <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-neon", accent)}>
            {icon}
          </div>
        </div>
      </GlassCard>
    </TiltCard>
  );
}
