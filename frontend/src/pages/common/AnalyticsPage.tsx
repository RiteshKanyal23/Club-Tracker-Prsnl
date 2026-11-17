import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatCard } from "../../components/ui/StatCard";
import { analyticsApi } from "../../features/analytics/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { Activity, FolderKanban, CheckSquare } from "lucide-react";

export function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [workload, setWorkload] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [error, setError] = useState<string|null>(null);

  useEffect(()=>{ (async()=>{
    try { const [o,w,t] = await Promise.all([analyticsApi.overview(), analyticsApi.workload(), analyticsApi.trends(14)]); setOverview(o.data); setWorkload(w.data); setTrends(t.data||[]); }
    catch(e:any){ setError(e.message); }
  })(); },[]);

  const chartText = "#94a3b8"; const grid = "rgba(255,255,255,0.06)";
  const tooltipStyle = { background: "#111B35", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#e5e7eb" };

  return <AppLayout>
    <PageHeader title="Analytics & Insights" subtitle="Track performance, workload, and activity trends across the workspace." />
    {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{error}</div>}
    {overview && <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {Object.entries(overview.totals||{}).map(([k,v], i)=> (
        <StatCard key={k} title={k} value={typeof v === "number" ? v : Number(v)||0} icon={i%3===0?<FolderKanban size={18}/>:i%3===1?<CheckSquare size={18}/>:<Activity size={18}/>} accent={i%2===0?"from-accent to-cyan":"from-violet to-accent"} />
      ))}
    </div>}
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      <GlassCard className="h-80"><div className="font-semibold text-white mb-2">Tasks by Status</div><ResponsiveContainer width="100%" height="90%"><BarChart data={overview?.tasksByStatus||[]}><CartesianGrid stroke={grid} vertical={false} /><XAxis dataKey="status" tick={{fill:chartText,fontSize:11}} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{fill:chartText}} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" fill="#3B82F6" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></GlassCard>
      <GlassCard className="h-80"><div className="font-semibold text-white mb-2">Projects by Status</div><ResponsiveContainer width="100%" height="90%"><BarChart data={overview?.projectsByStatus||[]}><CartesianGrid stroke={grid} vertical={false} /><XAxis dataKey="status" tick={{fill:chartText,fontSize:11}} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{fill:chartText}} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" fill="#8B5CF6" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></GlassCard>
    </div>
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      <GlassCard className="h-96"><div className="font-semibold text-white mb-2">14-day Trends</div><ResponsiveContainer width="100%" height="90%"><LineChart data={trends}><CartesianGrid stroke={grid} /><XAxis dataKey="date" tick={{fill:chartText,fontSize:10}} /><YAxis allowDecimals={false} tick={{fill:chartText}} /><Tooltip contentStyle={tooltipStyle} /><Legend /><Line type="monotone" dataKey="present" stroke="#22D3EE" dot={false} /><Line type="monotone" dataKey="tasksDone" stroke="#3B82F6" dot={false} /><Line type="monotone" dataKey="leaveRequests" stroke="#8B5CF6" dot={false} /></LineChart></ResponsiveContainer></GlassCard>
      <GlassCard className="h-96 overflow-auto"><div className="font-semibold text-white mb-3">Member Workload (active tasks)</div><div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b border-white/10 text-slate-400"><th className="py-2 pr-2">Name</th><th className="py-2 pr-2">Active</th><th className="py-2 pr-2">Done</th><th className="py-2">Total</th></tr></thead><tbody>{(workload?.memberLoad||[]).map((m:any)=>(<tr key={m.memberId} className="border-b border-white/5 text-slate-200"><td className="py-2 pr-2">{m.name}</td><td className="py-2 pr-2 text-cyan">{m.activeTasks}</td><td className="py-2 pr-2 text-emerald-400">{m.doneTasks}</td><td className="py-2">{m.totalAssigned}</td></tr>))}{(!workload?.memberLoad||workload.memberLoad.length===0) && <tr><td colSpan={4} className="py-4 text-slate-500">No workload data.</td></tr>}</tbody></table></div></GlassCard>
    </div>
    <GlassCard><div className="font-semibold text-white mb-3">Team Workload</div><div className="grid md:grid-cols-3 gap-3">{(workload?.teamLoad||[]).map((t:any)=>(<div key={t.teamId} className="border border-white/10 rounded-xl p-3 bg-white/5"><div className="font-medium text-white">{t.name}</div><div className="text-sm text-slate-400 mt-1">Members: <span className="text-cyan">{t.members}</span> · Active tasks: <span className="text-cyan">{t.activeTasks}</span></div></div>))}{(!workload?.teamLoad||workload.teamLoad.length===0) && <div className="text-slate-500">No team workload data.</div>}</div></GlassCard>
  </AppLayout>;
}
