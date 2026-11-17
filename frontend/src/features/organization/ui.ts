export const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-accent/50 focus:ring-2 focus:ring-accent/20";

export const labelCls = "mb-1 block text-xs uppercase tracking-wide text-slate-400";

export const buttonCls =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent via-violet to-cyan px-4 py-2 text-sm font-medium text-white shadow-neon transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonCls =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-50";

export function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function formatTime(value?: string | Date | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function todayInput() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}
