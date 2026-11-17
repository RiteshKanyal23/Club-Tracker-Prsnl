import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban, Users, UserSquare2, CheckSquare, CheckCircle2, CalendarCheck,
  ArrowUpRight, Clock, CalendarDays, Bell, Award, TrendingUp, Activity
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, Line, Legend, Label
} from "recharts";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { GlassCard } from "../../components/ui/GlassCard";
import { CardSkeleton, ChartSkeleton } from "../../components/ui/Skeleton";
import { useAuthStore } from "../../store/auth.store";
import { analyticsApi } from "../../features/analytics/api";
import { projectsApi } from "../../features/projects/api";
import { meetingsApi } from "../../features/meetings/api";
import { notificationsApi } from "../../features/notifications/api";
import { leaveApi } from "../../features/leave/api";
import { achievementsApi } from "../../features/achievements/api";
import { announcementsApi } from "../../features/announcements/api";

const chartText = "#94a3b8";
const grid = "rgba(255,255,255,0.06)";
const tooltipStyle = { background: "#111B35", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#e5e7eb" };

function fmtDate(d: any) { try { return new Date(d).toLocaleString(); } catch { return ""; } }
function fmtShortDate(d: string) { try { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return d; } }

export function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [workload, setWorkload] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  const [trendRange, setTrendRange] = useState<"last14" | "this_month" | "last_month">("last14");
  const [memberPeriod, setMemberPeriod] = useState<"last14" | "this_month" | "last_month">("last14");
  const [trendLoading, setTrendLoading] = useState(false);
  const [workloadLoading, setWorkloadLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [trendError, setTrendError] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    console.log("[AdminDashboard] mounting, fetching analytics & dashboard data...");
    (async () => {
      try {
        setChartError(null);
        const results = await Promise.allSettled([
          analyticsApi.overview(),
          analyticsApi.workload({ range: "last14" }),
          analyticsApi.trends({ range: "last14" }),
          projectsApi.list({ limit: 10 }),
          meetingsApi.list(),
          notificationsApi.list(false),
          leaveApi.list(),
          achievementsApi.awards(),
          announcementsApi.list(),
        ]);
        console.log("[AdminDashboard] initial fetch statuses:", results.map((r, i) => ({ i, status: r.status, reason: r.status === "rejected" ? String((r as any).reason) : undefined })));
        const val = (i: number) => results[i].status === "fulfilled" ? (results[i] as any).value?.data : null;
        if (results[0].status === "rejected" && results[1].status === "rejected" && results[2].status === "rejected") {
          setChartError("Failed to load analytics data.");
        }
        const ov = val(0); const wl = val(1); const tr = val(2) || [];
        console.log("[AdminDashboard] overview:", ov);
        console.log("[AdminDashboard] workload:", wl);
        console.log("[AdminDashboard] trends(sample):", Array.isArray(tr) ? tr.slice(0, 3) : tr, "count:", Array.isArray(tr) ? tr.length : 0);
        setOverview(ov); setWorkload(wl); setTrends(tr);
        const p = val(3); setProjects(p?.items || p || []);
        setMeetings(val(4) || []);
        setNotifications((val(5) || []).slice(0, 6));
        setLeaves(val(6) || []);
        setAwards((val(7) || []).slice(0, 6));
        setAnnouncements((val(8) || []).slice(0, 5));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    console.log("[AdminDashboard] trendRange changed ->", trendRange);
    (async () => {
      try {
        setTrendLoading(true); setTrendError(null);
        const range = trendRange === "last14" ? "last14" : trendRange;
        const res = await analyticsApi.trends(range === "last14" ? { days: 14 } : { range });
        console.log("[AdminDashboard] trends response:", { range, count: Array.isArray(res.data) ? res.data.length : 0, sample: (res.data || []).slice(0, 2) });
        if (!cancelled) setTrends(res.data || []);
      } catch (e) {
        console.error("[AdminDashboard] trends fetch failed", e);
        if (!cancelled) setTrendError("Failed to load activity & attendance data.");
      } finally {
        if (!cancelled) setTrendLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [trendRange]);

  useEffect(() => {
    let cancelled = false;
    console.log("[AdminDashboard] memberPeriod changed ->", memberPeriod);
    (async () => {
      try {
        setWorkloadLoading(true);
        const range = memberPeriod === "last14" ? "last14" : memberPeriod;
        const res = await analyticsApi.workload(range === "last14" ? { days: 14 } : { range });
        console.log("[AdminDashboard] workload response:", { range, members: Array.isArray(res.data?.memberLoad) ? res.data.memberLoad.length : 0 });
        if (!cancelled) setWorkload(res.data || null);
      } catch (e) {
        console.error("[AdminDashboard] workload fetch failed", e);
      } finally {
        if (!cancelled) setWorkloadLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [memberPeriod]);

  useEffect(() => {
    console.log("[AdminDashboard] chart datasets", {
      projectStatusData, totalProjects,
      memberProdCount: memberProdData.length,
      taskSummary, totalTasksAll, completionPct,
      trendPoints: trendData.length,
    });
  }, [overview, workload, trends, loading, trendLoading, workloadLoading]);

  const totals = overview?.totals || {};
  const tasksByStatus = overview?.tasksByStatus || [];
  const projectsByStatusRaw = overview?.projectsByStatus || [];
  const taskSummary = overview?.taskSummary || {};

  const activeTasks = useMemo(() => (taskSummary.pending || 0) + (taskSummary.inProgress || 0), [taskSummary]);
  const completedTasks = taskSummary.completed || 0;
  const attendanceOverview = useMemo(() => {
    if (totals.attendance != null) return String(totals.attendance);
    const totalPresent = trends.reduce((a, b) => a + (Number(b.present) || 0), 0);
    return trends.length ? `${totalPresent} (period)` : "—";
  }, [totals, trends]);

  // 1) Project Performance
  const projectStatusData = useMemo(() => {
    const map: Record<string, number> = { PLANNING: 0, ACTIVE: 0, REVIEW: 0, COMPLETED: 0, ON_HOLD: 0 };
    projectsByStatusRaw.forEach((p: any) => { if (p?.status) map[String(p.status).toUpperCase()] = Number(p.count) || 0; });
    return [
      { status: "Not Started", count: map.PLANNING || 0, color: "#22D3EE" },
      { status: "In Progress", count: map.ACTIVE || 0, color: "#3B82F6" },
      { status: "Under Review", count: map.REVIEW || 0, color: "#8B5CF6" },
      { status: "Completed", count: map.COMPLETED || 0, color: "#34d399" },
      { status: "On Hold", count: map.ON_HOLD || 0, color: "#f59e0b" },
    ];
  }, [projectsByStatusRaw]);
  const totalProjects = useMemo(() => projectStatusData.reduce((a, b) => a + b.count, 0), [projectStatusData]);

  // 2) Team Productivity (member-wise)
  const memberProdData = useMemo(() => {
    const list = (workload?.memberLoad || []).map((m: any) => ({
      name: m.name || "Member",
      completed: Number(m.completed || 0),
      pending: Number(m.pending || 0),
      inProgress: Number(m.inProgress || 0),
      assigned: Number(m.assigned || 0),
    })).sort((a: any, b: any) => b.completed - a.completed || b.assigned - a.assigned);
    return list.slice(0, 8);
  }, [workload]);

  // 3) Task Completion
  const taskCompletionData = useMemo(() => {
    const completed = Number(taskSummary.completed || 0);
    const pending = Number(taskSummary.pending || 0);
    const inProgress = Number(taskSummary.inProgress || 0);
    const overdue = Number(taskSummary.overdue || 0);
    return [
      { name: "Completed", value: completed, color: "#34d399" },
      { name: "Pending", value: pending, color: "#f59e0b" },
      { name: "In Progress", value: inProgress, color: "#3B82F6" },
      { name: "Overdue", value: overdue, color: "#f43f5e" },
    ];
  }, [taskSummary]);
  const totalTasksAll = Number(taskSummary.total || 0);
  const completionPct = Number(taskSummary.completionRate || 0);

  // 4) Activity & Attendance
  const trendData = useMemo(() => (trends || []).map((d: any) => ({
    ...d,
    dateLabel: fmtShortDate(d.date),
    tasksCreated: Number(d.tasksCreated || 0),
    tasksCompleted: Number(d.tasksCompleted || d.tasksDone || 0),
    activityCount: Number(d.activityCount || (Number(d.tasksCreated || 0) + Number(d.tasksCompleted || d.tasksDone || 0))),
    present: Number(d.present || 0),
    absent: Number(d.absent || 0),
    attendancePercentage: Number(d.attendancePercentage || 0),
  })), [trends]);

  const pendingLeaves = leaves.filter((l: any) => String(l.status).toUpperCase() === "PENDING");
  const upcomingMeetings = useMemo(() => {
    const nowTs = Date.now();
    return [...meetings].filter((m: any) => new Date(m.scheduledAt).getTime() >= nowTs - 3600000).sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).slice(0, 5);
  }, [meetings]);

  const recentActivities = useMemo(() => {
    const acts: any[] = [];
    projects.slice(0, 4).forEach((p: any) => acts.push({ type: "Project", title: p.name, detail: `Status: ${p.status}`, at: p.updatedAt || p.createdAt }));
    announcements.slice(0, 3).forEach((a: any) => acts.push({ type: "Announcement", title: a.title, detail: a.content?.slice(0, 60) || "", at: a.createdAt }));
    meetings.slice(0, 3).forEach((m: any) => acts.push({ type: "Meeting", title: m.title, detail: fmtDate(m.scheduledAt), at: m.createdAt || m.scheduledAt }));
    awards.slice(0, 3).forEach((aw: any) => acts.push({ type: "Achievement", title: `${aw.member?.user?.name || "Member"} • ${aw.achievement?.name || "Award"}`, detail: aw.note || "Recognition awarded", at: aw.awardedAt }));
    return acts.filter(a => a.at).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 8);
  }, [projects, announcements, meetings, awards]);

  const topTeams = (workload?.teamLoad || []).slice().sort((a: any, b: any) => (b.activeTasks || 0) - (a.activeTasks || 0)).slice(0, 5);

  const periodSelectClass = "bg-[#0b1430] border border-white/10 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-cyan/40";

  const renderProjectTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const pct = totalProjects ? Math.round((d.count / totalProjects) * 100) : 0;
    return <div style={tooltipStyle} className="p-2 text-xs"><div className="font-medium text-white">{d.status}</div><div>Projects: {d.count}</div><div>Share: {pct}%</div></div>;
  };
  const renderTaskTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const pct = totalTasksAll ? Math.round((d.value / totalTasksAll) * 100) : 0;
    return <div style={tooltipStyle} className="p-2 text-xs"><div className="font-medium text-white">{d.name}</div><div>Tasks: {d.value}</div><div>Share: {pct}%</div></div>;
  };

  return (
    <AppLayout>
      <PageHeader
        title={`Welcome Back, ${user?.name?.split(" ")[0] || "Admin"}!`}
        subtitle="Here's what's happening across your Team Algebra workspace."
        actions={
          <div className="flex gap-2 flex-wrap">
            <Link to="/admin/projects" className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-violet text-white text-sm font-medium shadow-neon hover:opacity-95 transition">New Project</Link>
            <Link to="/admin/meetings" className="px-4 py-2 rounded-xl glass text-sm text-slate-200 hover:text-white border border-white/10">Schedule Meeting</Link>
            <Link to="/admin/analytics" className="px-4 py-2 rounded-xl glass text-sm text-slate-200 hover:text-white border border-white/10">View Analytics</Link>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
          <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-cyan" /> {now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          <span className="flex items-center gap-1.5"><Clock size={14} className="text-violet" /> {now.toLocaleTimeString()}</span>
        </div>
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-6">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-6">
          <StatCard title="Total Projects" value={totals.projects ?? projects.length ?? 0} icon={<FolderKanban size={20} />} accent="from-accent to-cyan" />
          <StatCard title="Total Teams" value={totals.teams ?? 0} icon={<Users size={20} />} accent="from-violet to-accent" />
          <StatCard title="Total Members" value={totals.members ?? 0} icon={<UserSquare2 size={20} />} accent="from-cyan to-accent" />
          <StatCard title="Active Tasks" value={activeTasks || totals.activeTasks || 0} icon={<CheckSquare size={20} />} accent="from-amber-500 to-orange-500" />
          <StatCard title="Completed Tasks" value={completedTasks || totals.completedTasks || 0} icon={<CheckCircle2 size={20} />} accent="from-emerald-500 to-cyan" />
          <StatCard title="Attendance Overview" value={attendanceOverview} icon={<CalendarCheck size={20} />} accent="from-fuchsia-500 to-violet" subtitle="records / period" />
        </div>
      )}

      {chartError && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm px-4 py-3">{chartError}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <GlassCard className="h-[340px]">
          <div className="flex items-center justify-between mb-3 shrink-0"><h3 className="font-semibold text-white flex items-center gap-2"><TrendingUp size={16} className="text-cyan" /> Project Performance</h3><span className="text-xs text-slate-500">by status</span></div>
          {loading ? <ChartSkeleton /> : totalProjects === 0 ? (
            <div className="flex-1 min-h-0 flex items-center justify-center text-slate-400 text-sm">No project data available.</div>
          ) : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={projectStatusData} dataKey="count" nameKey="status" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {projectStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    <Label position="center" content={() => (
                      <g>
                        <text x="50%" y="47%" textAnchor="middle" fill="#e5e7eb" fontSize="20" fontWeight="700">{totalProjects}</text>
                        <text x="50%" y="56%" textAnchor="middle" fill="#94a3b8" fontSize="10" letterSpacing="0.08em">TOTAL PROJECTS</text>
                      </g>
                    )} />
                  </Pie>
                  <Tooltip content={renderProjectTooltip} />
                  <Legend verticalAlign="bottom" height={32} wrapperStyle={{ fontSize: 11, color: chartText }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

        <GlassCard className="h-[340px]">
          <div className="flex items-center justify-between mb-3 gap-2 shrink-0">
            <h3 className="font-semibold text-white flex items-center gap-2"><Users size={16} className="text-violet" /> Team Productivity</h3>
            <select value={memberPeriod} onChange={(e) => setMemberPeriod(e.target.value as any)} className={periodSelectClass}>
              <option value="last14">Last 14 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>
          </div>
          {loading || workloadLoading ? <ChartSkeleton /> : memberProdData.length === 0 ? (
            <div className="flex-1 min-h-0 flex items-center justify-center text-slate-400 text-sm text-center px-2">No member productivity data for this period.</div>
          ) : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberProdData} layout="vertical" margin={{ left: 4, right: 12, top: 0, bottom: 0 }}>
                  <CartesianGrid stroke={grid} horizontal={false} />
                  <XAxis type="number" tick={{ fill: chartText, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={86} tick={{ fill: chartText, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: chartText }} />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#34d399" />
                  <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#3B82F6" />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <GlassCard className="h-[320px]">
          <h3 className="font-semibold text-white mb-2 flex items-center gap-2 shrink-0"><CheckCircle2 size={16} className="text-emerald-400" /> Task Completion</h3>
          {loading ? <ChartSkeleton /> : totalTasksAll === 0 ? (
            <div className="flex-1 min-h-0 flex items-center justify-center text-slate-400 text-sm">No task data available.</div>
          ) : (
            <>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskCompletionData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={3}>
                      {taskCompletionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      <Label position="center" content={() => (
                        <g>
                          <text x="50%" y="46%" textAnchor="middle" fill="#e5e7eb" fontSize="20" fontWeight="700">{completionPct}%</text>
                          <text x="50%" y="57%" textAnchor="middle" fill="#94a3b8" fontSize="9" letterSpacing="0.08em">COMPLETED</text>
                        </g>
                      )} />
                    </Pie>
                    <Tooltip content={renderTaskTooltip} />
                    <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 10, color: chartText }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="shrink-0 pt-1 text-[10px] text-slate-400 flex flex-wrap gap-x-2 gap-y-0.5 justify-center leading-tight">
                <span>Total: {totalTasksAll}</span><span>Done: {completedTasks}</span><span>Pending: {taskSummary.pending || 0}</span><span>In Prog: {taskSummary.inProgress || 0}</span><span>Overdue: {taskSummary.overdue || 0}</span>
              </div>
            </>
          )}
        </GlassCard>

        <GlassCard className="h-[320px] xl:col-span-2">
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap shrink-0">
            <h3 className="font-semibold text-white flex items-center gap-2"><Activity size={16} className="text-cyan" /> Monthly / 14-day Activity & Attendance</h3>
            <select value={trendRange} onChange={(e) => setTrendRange(e.target.value as any)} className={periodSelectClass}>
              <option value="last14">Last 14 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>
          </div>
          {loading || trendLoading ? <ChartSkeleton /> : trendError ? (
            <div className="flex-1 min-h-0 flex items-center justify-center text-rose-300 text-sm">{trendError}</div>
          ) : trendData.length === 0 ? (
            <div className="flex-1 min-h-0 flex items-center justify-center text-slate-400 text-sm">No activity or attendance data for this period.</div>
          ) : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: 0, right: 8, top: 5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35}/><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22D3EE" stopOpacity={0.35}/><stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid stroke={grid} vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fill: chartText, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={18} />
                  <YAxis yAxisId="left" tick={{ fill: chartText, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: chartText, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(_, p) => p?.[0]?.payload?.date || ""} />
                  <Legend wrapperStyle={{ fontSize: 10, color: chartText }} />
                  <Area yAxisId="left" type="monotone" dataKey="activityCount" name="Daily Activity" stroke="#3B82F6" fill="none" strokeWidth={2} dot={false} />
                  <Area yAxisId="left" type="monotone" dataKey="tasksCreated" name="Tasks Created" stroke="#8B5CF6" fill="url(#gCreated)" strokeWidth={2} dot={false} />
                  <Area yAxisId="left" type="monotone" dataKey="tasksCompleted" name="Tasks Completed" stroke="#22D3EE" fill="url(#gCompleted)" strokeWidth={2} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="present" name="Members Present" stroke="#34d399" strokeWidth={2} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="absent" name="Members Absent" stroke="#f97316" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="attendancePercentage" name="Attendance %" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <GlassCard className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-white">Recent Activities</h3><Link to="/admin/analytics" className="text-xs text-cyan flex items-center gap-1">View all <ArrowUpRight size={12} /></Link></div>
          <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
            {recentActivities.length === 0 ? <div className="text-slate-400 text-sm">No recent activity available.</div> : recentActivities.map((a, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-accent to-cyan shadow-neon shrink-0" />
                <div className="flex-1 pb-3 border-b border-white/5">
                  <div className="flex items-center justify-between gap-2"><span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-cyan border border-white/10">{a.type}</span><span className="text-[11px] text-slate-500">{fmtDate(a.at)}</span></div>
                  <div className="text-sm text-white mt-1 font-medium">{a.title}</div>
                  {a.detail && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{a.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
        <div className="space-y-4">
          <GlassCard>
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><CalendarDays size={16} className="text-accent" /> Upcoming Meetings</h3>
            <div className="space-y-2">
              {upcomingMeetings.length === 0 ? <div className="text-slate-400 text-sm">No upcoming meetings.</div> : upcomingMeetings.map((m: any) => (
                <div key={m.id} className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-sm text-white font-medium">{m.title}</div>
                  <div className="text-xs text-slate-400">{fmtDate(m.scheduledAt)}</div>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><CheckSquare size={16} className="text-amber-400" /> Pending Approvals</h3>
            <div className="space-y-2">
              {pendingLeaves.length === 0 ? <div className="text-slate-400 text-sm">No pending approvals.</div> : pendingLeaves.slice(0, 4).map((l: any) => (
                <div key={l.id} className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-2">
                  <div><div className="text-sm text-white">{l.member?.user?.name || "Member"}</div><div className="text-xs text-slate-400">Leave request</div></div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">PENDING</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Bell size={16} className="text-cyan" /> Recent Notifications</h3>
          <div className="space-y-2">{notifications.length === 0 ? <div className="text-slate-400 text-sm">No notifications.</div> : notifications.map((n: any) => (<div key={n.id} className="p-2 rounded-xl bg-white/5 border border-white/5"><div className="text-sm text-white">{n.title}</div><div className="text-xs text-slate-400 line-clamp-1">{n.body || n.type}</div></div>))}</div>
        </GlassCard>
        <GlassCard>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Users size={16} className="text-violet" /> Top Performing Teams</h3>
          <div className="space-y-2">{topTeams.length === 0 ? <div className="text-slate-400 text-sm">No team data.</div> : topTeams.map((t: any, i: number) => (<div key={t.teamId || i} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5"><div><div className="text-sm text-white">{t.name}</div><div className="text-xs text-slate-400">Members: {t.members}</div></div><div className="text-xs text-cyan font-medium">{t.activeTasks} active</div></div>))}</div>
        </GlassCard>
        <GlassCard>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Award size={16} className="text-amber-400" /> Recent Achievements</h3>
          <div className="space-y-2">{awards.length === 0 ? <div className="text-slate-400 text-sm">No awards yet.</div> : awards.map((aw: any) => (<div key={aw.id} className="p-2 rounded-xl bg-white/5 border border-white/5"><div className="text-sm text-white">{aw.achievement?.name || "Achievement"}</div><div className="text-xs text-slate-400">{aw.member?.user?.name || "Member"} • {fmtDate(aw.awardedAt)}</div></div>))}</div>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
