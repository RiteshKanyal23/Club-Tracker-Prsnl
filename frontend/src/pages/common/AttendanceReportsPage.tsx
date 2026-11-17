import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Download, RefreshCw, Users } from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { EmptyState } from "../../components/ui/EmptyState";
import { GlassCard } from "../../components/ui/GlassCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { StatusBadge } from "../../features/attendance/components/StatusBadge";
import { attendanceApi } from "../../features/attendance/api";
import { organizationApi } from "../../features/organization/api";
import { formatDate, formatTime, inputCls, labelCls, secondaryButtonCls } from "../../features/organization/ui";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

function groupBreakdown(items: any[], key: (item: any) => string) {
  const map = new Map<string, any>();
  items.forEach((item) => {
    const label = key(item) || "Unknown";
    if (!map.has(label)) {
      map.set(label, { label, total: 0, PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 });
    }
    const row = map.get(label);
    row.total += 1;
    row[String(item.status || "ABSENT").toUpperCase()] = (row[String(item.status || "ABSENT").toUpperCase()] || 0) + 1;
  });
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function BreakdownCard({ title, rows }: { title: string; rows: any[] }) {
  return (
    <GlassCard hover={false}>
      <h3 className="mb-4 text-base font-semibold text-white">{title}</h3>
      {rows.length === 0 ? (
        <div className="py-4 text-sm text-slate-500">No data for the selected filters.</div>
      ) : (
        <div className="space-y-2">
          {rows.slice(0, 12).map((row) => (
            <div key={row.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="truncate text-sm text-white">{row.label}</div>
                <div className="text-xs text-slate-400">{row.total} record{row.total === 1 ? "" : "s"}</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">Present {row.PRESENT || 0}</span>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300">Late {row.LATE || 0}</span>
                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-300">Absent {row.ABSENT || 0}</span>
                <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-sky-300">Excused {row.EXCUSED || 0}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan"
                  style={{ width: `${row.total ? Math.round(((row.PRESENT || 0) + (row.LATE || 0)) / row.total * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export function AttendanceReportsPage() {
  const [filters, setFilters] = useState<any>({
    projectId: "",
    projectManagerId: "",
    teamId: "",
    teamLeadId: "",
    memberId: "",
    status: "",
    from: "",
    to: "",
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [rosterRows, setRosterRows] = useState<any[]>([]);
  const [report, setReport] = useState<any>({ summary: { total: 0, present: 0, absent: 0, late: 0, excused: 0 }, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setFilter = (key: string, value: string) => setFilters((prev: any) => ({ ...prev, [key]: value }));

  const query = useMemo(() => {
    const q: any = { limit: 1000 };
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      if (key === "from") q.from = `${value}T00:00:00`;
      else if (key === "to") q.to = `${value}T23:59:59`;
      else q[key] = value;
    });
    return q;
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, m, r, rep] = await Promise.all([
        organizationApi.projects(),
        organizationApi.members(),
        organizationApi.roster(),
        attendanceApi.report(query),
      ]);
      setProjects((p.data || []) as any[]);
      setMembers((m.data?.items || []) as any[]);
      setRosterRows((r.data?.rows || []) as any[]);
      setReport(rep.data || { summary: {}, items: [] });
    } catch (err: any) {
      setError(err.message || "Unable to load attendance report");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const items: any[] = report?.items || [];
  const summary = report?.summary || {};
  const teams = projects.flatMap((p) => (p.teams || []).map((t: any) => ({ ...t, projectName: p.name, projectId: p.id })));
  const managers = projects.filter((p) => p.manager).map((p) => ({ id: p.manager.id, name: p.manager.name, projectName: p.name }));
  const leads = rosterRows.filter((row) => String(row.designation || "").toLowerCase().includes("team lead"));
  const rate = summary.total ? Math.round(((summary.present || 0) + (summary.late || 0)) / summary.total * 100) : 0;

  return (
    <AppLayout>
      <PageHeader
        title="Attendance Reports"
        subtitle="Filter and analyze attendance by project, project manager, team, team lead, member, date, and status."
        actions={
          <>
            <button className={secondaryButtonCls} onClick={() => void load()} disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <a className={secondaryButtonCls} href={attendanceApi.exportCsvUrl(query)} target="_blank" rel="noreferrer">
              <Download size={15} /> Export CSV
            </a>
          </>
        }
      />

      {error && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{error}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Records" value={summary.total || 0} icon={<BarChart3 size={19} />} />
        <StatCard title="Present" value={summary.present || 0} icon={<Users size={19} />} accent="from-emerald-500 to-cyan" />
        <StatCard title="Late" value={summary.late || 0} icon={<Users size={19} />} accent="from-amber-500 to-orange-500" />
        <StatCard title="Absent" value={summary.absent || 0} icon={<Users size={19} />} accent="from-rose-500 to-violet" />
        <StatCard title="Attendance Rate" value={`${rate}%`} icon={<BarChart3 size={19} />} accent="from-cyan to-accent" />
      </div>

      <GlassCard className="mb-6" hover={false}>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          <div>
            <label className={labelCls}>Project</label>
            <select className={inputCls} value={filters.projectId} onChange={(e) => setFilter("projectId", e.target.value)}>
              <option value="">All projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Project Manager</label>
            <select className={inputCls} value={filters.projectManagerId} onChange={(e) => setFilter("projectManagerId", e.target.value)}>
              <option value="">All managers</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.projectName}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Team</label>
            <select className={inputCls} value={filters.teamId} onChange={(e) => setFilter("teamId", e.target.value)}>
              <option value="">All teams</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.projectName} · {t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Team Lead</label>
            <select className={inputCls} value={filters.teamLeadId} onChange={(e) => setFilter("teamLeadId", e.target.value)}>
              <option value="">All team leads</option>
              {leads.map((lead) => <option key={lead.memberRecordId} value={lead.memberRecordId}>{lead.name} · {lead.project}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Member</label>
            <select className={inputCls} value={filters.memberId} onChange={(e) => setFilter("memberId", e.target.value)}>
              <option value="">All members</option>
              {members.map((m) => <option key={m.member?.id} value={m.member?.id}>{m.member?.name} · {m.member?.memberId}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>From Date</label>
            <input type="date" className={inputCls} value={filters.from} onChange={(e) => setFilter("from", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>To Date</label>
            <input type="date" className={inputCls} value={filters.to} onChange={(e) => setFilter("to", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className={secondaryButtonCls} onClick={() => setFilters({ projectId: "", projectManagerId: "", teamId: "", teamLeadId: "", memberId: "", status: "", from: "", to: "" })}>
              Clear filters
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <BreakdownCard title="By Project" rows={groupBreakdown(items, (i) => i.projectName || "Unassigned")} />
        <BreakdownCard title="By Team" rows={groupBreakdown(items, (i) => i.teamName || "Unassigned")} />
        <BreakdownCard title="By Individual" rows={groupBreakdown(items, (i) => i.memberName || i.member?.user?.name || "Unknown")} />
      </div>

      <GlassCard hover={false}>
        <h3 className="mb-4 text-base font-semibold text-white">Attendance Records</h3>
        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading report...</div>
        ) : items.length === 0 ? (
          <EmptyState title="No attendance records" description="Adjust the filters or mark attendance from the roster." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Member ID</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Project</th>
                  <th className="py-2 pr-3">Project Manager</th>
                  <th className="py-2 pr-3">Team</th>
                  <th className="py-2 pr-3">Designation</th>
                  <th className="py-2 pr-3">Team Lead</th>
                  <th className="py-2 pr-3">Session</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Check-in</th>
                  <th className="py-2 pr-3">Marked By</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-white/5 text-slate-300">
                    <td className="py-2 pr-3">{formatDate(item.date)}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{item.memberIdText || item.member?.memberId || "—"}</td>
                    <td className="py-2 pr-3">{item.memberName || item.member?.user?.name || "—"}</td>
                    <td className="py-2 pr-3">{item.projectName || "—"}</td>
                    <td className="py-2 pr-3">{item.projectManagerName || "—"}</td>
                    <td className="py-2 pr-3">{item.teamName || "—"}</td>
                    <td className="py-2 pr-3">{item.designationName || "—"}</td>
                    <td className="py-2 pr-3">{item.teamLeadName || "—"}</td>
                    <td className="py-2 pr-3">{item.sessionName || "—"}</td>
                    <td className="py-2 pr-3"><StatusBadge status={item.status} /></td>
                    <td className="py-2 pr-3">{formatTime(item.checkIn)}</td>
                    <td className="py-2 pr-3">{item.markedBy?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </AppLayout>
  );
}
