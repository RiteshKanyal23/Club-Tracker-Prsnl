import { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({ title = "No data", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return (
    <div className="glass rounded-2xl p-10 text-center flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
        <Inbox size={22} />
      </div>
      <div className="text-lg font-medium text-white">{title}</div>
      {description && <div className="text-sm text-slate-400 max-w-md">{description}</div>}
      {action}
    </div>
  );
}
