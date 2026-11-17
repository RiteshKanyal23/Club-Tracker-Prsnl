import { PropsWithChildren, ReactNode } from "react";
import { motion } from "framer-motion";

export function PageHeader({ title, subtitle, actions, children }: PropsWithChildren<{ title: string; subtitle?: string; actions?: ReactNode }>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-400 mt-1">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </motion.div>
  );
}
