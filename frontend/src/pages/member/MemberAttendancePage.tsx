import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatCard } from "../../components/ui/StatCard";
import { attendanceApi } from "../../features/attendance/api";
import { CalendarCheck, Percent, Clock, XCircle } from "lucide-react";

function ProofButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const onView = async () => {
    setLoading(true);
    try {
      const res = await fetch(attendanceApi.photoUrl(id), { credentials: "include" });
      if (!res.ok) throw new Error("Unable to load proof");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { alert("Attendance proof is unavailable or access denied."); }
    finally { setLoading(false); }
  };
  return <button className="text-cyan hover:underline disabled:opacity-50" onClick={onView} disabled={loading}>{loading ? "Loading..." : "View"}</button>;
}

export function MemberAttendancePage() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [month, setMonth] = useState<string>(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });
  const [error, setError] = useState<string|null>(null);

  const load = async () => {
    try {
      const [y,m] = month.split("-").map(Number);
      const [l, s] = await Promise.all([attendanceApi.list({ month: m, year: y, limit: 200 }), attendanceApi.stats()]);
      setItems(l.data?.items || l.data || []); setStats(s.data || null); setError(null);
    } catch (e: any) { setError(e.message); }
  };
  useEffect(() => { load(); }, [month]);

  const pct = stats?.attendancePercentage ?? 0;
  const present = stats?.present ?? 0;
  const absent = stats?.absent ?? 0;

  return <AppLayout>
    <PageHeader title="My Attendance" subtitle="View your attendance history, status, and monthly summaries." actions={<input type="month" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200" value={month} onChange={e=>setMonth(e.target.value)} />} />
    {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{error}</div>}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <StatCard title="Attendance %" value={pct} icon={<Percent size={20} />} accent="from-accent to-cyan" subtitle="based on records" />
      <StatCard title="Present" value={present} icon={<CalendarCheck size={20} />} accent="from-emerald-500 to-cyan" />
      <StatCard title="Absent" value={absent} icon={<XCircle size={20} />} accent="from-rose-500 to-orange-500" />
      <StatCard title="Records" value={stats?.totalRecords ?? items.length} icon={<Clock size={20} />} accent="from-violet to-accent" />
    </div>
    <GlassCard className="mb-6">
      <h2 className="font-semibold text-white mb-3">Monthly Summary</h2>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10"><div className="text-slate-400">Present/Late</div><div className="text-emerald-400 text-lg font-semibold">{present}</div></div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10"><div className="text-slate-400">Absent</div><div className="text-rose-400 text-lg font-semibold">{absent}</div></div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10"><div className="text-slate-400">Excused</div><div className="text-amber-300 text-lg font-semibold">{stats?.excused ?? 0}</div></div>
      </div>
    </GlassCard>
    <GlassCard>
      <h2 className="font-semibold text-white mb-3">Attendance History</h2>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 border-b border-white/10"><th className="py-2 pr-2">Date</th><th className="py-2 pr-2">Session</th><th className="py-2 pr-2">Status</th><th className="py-2 pr-2">Check-in</th><th className="py-2 pr-2">Check-out</th><th className="py-2">Proof</th></tr></thead>
          <tbody>
            {items.map((r:any)=>(
              <tr key={r.id} className="border-b border-white/5 text-slate-200">
                <td className="py-2 pr-2">{new Date(r.date).toLocaleDateString()}</td>
                <td className="py-2 pr-2">{r.sessionName || "General"}</td>
                <td className="py-2 pr-2"><span className={`text-xs px-2 py-0.5 rounded-full border ${r.status==="PRESENT"?"bg-emerald-500/15 text-emerald-300 border-emerald-500/30":r.status==="LATE"?"bg-amber-500/15 text-amber-300 border-amber-500/30":r.status==="EXCUSED"?"bg-sky-500/15 text-sky-300 border-sky-500/30":"bg-rose-500/15 text-rose-300 border-rose-500/30"}`}>{r.status}</span></td>
                <td className="py-2 pr-2">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "—"}</td>
                <td className="py-2 pr-2">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "—"}</td>
                <td className="py-2">{r.photoPath ? <ProofButton id={r.id} /> : "—"}</td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan={6} className="py-4 text-slate-400">No attendance records found for this period.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500 mt-3">Attendance records are managed by administrators. You can view your history and permitted proof only.</p>
    </GlassCard>
  </AppLayout>;
}
