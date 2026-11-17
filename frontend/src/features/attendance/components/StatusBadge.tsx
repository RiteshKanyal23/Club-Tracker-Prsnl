export function StatusBadge({ status }: { status?: string | null }) {
  const value = String(status || "ABSENT").toUpperCase();
  const styles: Record<string, string> = {
    PRESENT: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    LATE: "border-amber-500/30 bg-amber-500/15 text-amber-300",
    EXCUSED: "border-sky-500/30 bg-sky-500/15 text-sky-300",
    ABSENT: "border-rose-500/30 bg-rose-500/15 text-rose-300",
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${styles[value] || styles.ABSENT}`}>
      {value.charAt(0) + value.slice(1).toLowerCase()}
    </span>
  );
}
