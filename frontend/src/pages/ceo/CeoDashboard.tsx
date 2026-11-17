import { Link } from "react-router-dom";
import { AlertTriangle, BarChart3, CalendarCheck, CheckCircle2, Network, Users } from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { GlassCard } from "../../components/ui/GlassCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { StatusBadge } from "../../features/attendance/components/StatusBadge";
import { attendanceApi } from "../../features/attendance/api";
import { organizationApi } from "../../features/organization/api";
import { formatDate, secondaryButtonCls } from "../../features/organization/ui";
import { useEffect, useState } from "react";

export function CeoDashboard() {
  const [validation, setValidation] = useState<any>(null);
  const [roster, setRoster] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      organizationApi.validation(),
      organizationApi.roster(),
      attendanceApi.report({ limit: 1000 }),
    ])
      .then(([v, r, a]) => {
        if (!active) return;
        setValidation(v.data);
        setRoster(r.data);
        setReport(a.data);
      })
      .catch((err: any) => active && setError(err.message || "Unable to load organization overview"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const items: any[] = report?.items || [];
  const summary = report?.summary || {};
  const warnings: any[] = roster?.warnings || [];

  return (
    <AppLayout>
      <PageHeader
        title="CEO Overview"
        subtitle="Full visibility across the organization, attendance, and hierarchy health."
        actions={<Link to="/ceo/attendance/reports" className={secondaryButtonCls}><BarChart3 size={15} /> Open Reports</Link>}
      />
      {error && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Projects" value={validation?.counts?.projects ?? 0} icon={<Network size={19} />} />
        <StatCard title="Teams" value={validation?.counts?.teams ?? 0} icon={<Users size={19} />} accent="from-violet to-cyan" />
        <StatCard title="Active Members" value={validation?.counts?.activeMembers ?? 0} icon={<Users size={19} />} accent="from-cyan to-accent" />
        <StatCard title="Attendance Records" value={summary.total || 0} icon={<CalendarCheck size={19} />} accent="from-emerald-500 to-accent" />
        <StatCard title="Open Issues" value={validation?.counts?.issues ?? 0} icon={<AlertTriangle size={19} />} accent="from-amber-500 to-rose-500" />
      </div>

      {validation && (
        <div className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${validation.canOpenAttendance ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
          {validation.canOpenAttendance ? <CheckCircle2 size={18} className="mt-0.5" /> : <AlertTriangle size={18} className="mt-0.5" />}
          <div>
            <div className="font-medium">
              {validation.canOpenAttendance ? "Organization hierarchy is complete and attendance-ready." : `${validation.counts?.issues || 0} hierarchy issue(s) require administrative attention.`}
            </div>
            {!validation.canOpenAttendance && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {(validation.issues || []).slice(0, 5).map((issue: any, i: number) => <li key={i}>{issue.message}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard hover={false}>
          <h2 className="mb-4 text-lg font-semibold text-white">Recent Attendance</h2>
          {loading ? (
            <div className="py-8 text-center text-slate-400">Loading...</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No attendance records yet.</div>
          ) : (
            <div className="space-y-2">
              {items.slice(0, 8).map((item: any) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <div>
                    <div className="text-white">{item.memberName || item.member?.user?.name}</div>
                    <div className="text-xs text-slate-400">{item.memberIdText} · {item.projectName} · {item.teamName} · {formatDate(item.date)}</div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard hover={false}>
          <h2 className="mb-4 text-lg font-semibold text-white">Hierarchy Warnings</h2>
          {warnings.length === 0 ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">No invalid or unassigned members.</div>
          ) : (
            <div className="space-y-2">
              {warnings.slice(0, 8).map((row: any, i: number) => (
                <div key={i} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-200">
                  <div className="font-medium">{row.name} · {row.memberId}</div>
                  <div className="text-xs text-amber-100/70">{row.issues?.join("; ") || "Invalid assignment"}</div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/ceo/organization" className={secondaryButtonCls}><Network size={15} /> View Organization</Link>
            <Link to="/ceo/attendance/roster" className={secondaryButtonCls}><CalendarCheck size={15} /> Attendance Roster</Link>
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
