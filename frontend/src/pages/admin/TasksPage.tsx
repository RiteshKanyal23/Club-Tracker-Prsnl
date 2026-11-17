import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { tasksApi, milestonesApi, progressApi } from "../../features/tasks/api";
import { projectsApi } from "../../features/projects/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;

export function TasksPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [view, setView] = useState<"kanban"|"list">("kanban");
  const [error, setError] = useState<string|null>(null);

  const loadProjects = async () => { const res = await projectsApi.list({ limit: 50 }); const items = res.data?.items || res.data || []; setProjects(items); if (!projectId && items[0]) setProjectId(items[0].id); };
  const load = async (pid: string) => {
    if (!pid) return;
    try {
      const [t, m, p] = await Promise.all([tasksApi.list({ projectId: pid, limit: 200 }), milestonesApi.list(pid), progressApi.project(pid)]);
      setTasks(t.data?.items || []); setMilestones(m.data || []); setProgress(p.data || null);
    } catch(e:any){ setError(e.message); }
  };
  useEffect(()=>{ loadProjects(); },[]);
  useEffect(()=>{ if (projectId) load(projectId); },[projectId]);

  const byStatus = useMemo(()=>{ const map:any = {TODO:[],IN_PROGRESS:[],REVIEW:[],DONE:[]}; tasks.filter(t=>!t.parentId).forEach(t=>{ (map[t.status]||map.TODO).push(t); }); return map; },[tasks]);
  const create = async (e:any)=>{ e.preventDefault(); if(!projectId||!title) return; await tasksApi.create({ projectId, title, status: "TODO" }); setTitle(""); load(projectId); };
  const move = async (id:string, status:string)=>{ await tasksApi.move(id,{status}); load(projectId); };
  const onDrop = async (e:any, status:string)=>{ const id = e.dataTransfer.getData("taskId"); if(id) await move(id,status); };

  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40";

  return <AppLayout>
    <PageHeader title="Tasks & Progress" subtitle="Manage tasks, track milestones, and monitor project progress."
      actions={<div className="flex gap-2"><button className={`px-4 py-2 rounded-xl border transition ${view==="kanban"?"bg-gradient-to-r from-accent to-violet text-white border-transparent shadow-neon":"glass border-white/10 text-slate-300 hover:text-white"}`} onClick={()=>setView("kanban")}>Kanban</button><button className={`px-4 py-2 rounded-xl border transition ${view==="list"?"bg-gradient-to-r from-accent to-violet text-white border-transparent shadow-neon":"glass border-white/10 text-slate-300 hover:text-white"}`} onClick={()=>setView("list")}>List</button></div>}
    />
    {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{error}</div>}
    <GlassCard className="mb-6">
      <div className="flex flex-col md:flex-row gap-3">
        <select className={`${inputCls} md:w-72`} value={projectId} onChange={e=>setProjectId(e.target.value)}>
          {projects.map(p=><option key={p.id} value={p.id} className="bg-deep">{p.name}</option>)}
        </select>
        <form onSubmit={create} className="flex flex-1 gap-2">
          <input className={`${inputCls} flex-1`} placeholder="New task title" value={title} onChange={e=>setTitle(e.target.value)} />
          <button className="bg-gradient-to-r from-accent to-violet text-white px-5 py-2 rounded-xl shadow-neon hover:opacity-95 transition font-medium whitespace-nowrap">Add Task</button>
        </form>
      </div>
    </GlassCard>

    {progress && <div className="grid md:grid-cols-2 gap-4 mb-6">
      <GlassCard>
        <div className="font-semibold text-white mb-1">Project Progress</div>
        <div className="text-sm text-slate-400 mb-3">{progress.done}/{progress.total} tasks done ({progress.percent}%)</div>
        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden mb-4"><div className="h-2.5 rounded-full bg-gradient-to-r from-accent via-violet to-cyan" style={{width:`${progress.percent}%`}} /></div>
        <div className="text-sm font-medium text-slate-200 mb-2">Milestones</div>
        <ul className="text-sm text-slate-400 space-y-1">{(milestones||[]).map((m:any)=><li key={m.id} className="flex justify-between"><span>{m.title}</span><span className="text-cyan">{m.progress?.percent ?? 0}%</span></li>)}{(!milestones||milestones.length===0) && <li className="text-slate-500">No milestones</li>}</ul>
      </GlassCard>
      <GlassCard className="h-64 md:h-auto">
        <div className="font-semibold text-white mb-2">Burndown (remaining tasks)</div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={progress.burndown || []}><XAxis dataKey="date" tick={{fill:'#94a3b8',fontSize:10}} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{fill:'#94a3b8',fontSize:11}} axisLine={false} tickLine={false} /><Tooltip contentStyle={{background:'#111B35',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,color:'#e5e7eb'}} /><Bar dataKey="remaining" fill="#3B82F6" radius={[6,6,0,0]} /></BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>}

    {view === "kanban" ? (
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUSES.map(s=> (
          <div key={s} className="glass rounded-2xl p-3 min-h-[320px] border border-white/10" onDragOver={e=>e.preventDefault()} onDrop={e=>onDrop(e,s)}>
            <div className="font-semibold mb-3 text-white flex items-center justify-between"><span>{s.replace("_"," ")}</span><span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-cyan">{(byStatus[s]||[]).length}</span></div>
            <div className="space-y-2">
              {(byStatus[s]||[]).map((t:any)=> (
                <div key={t.id} draggable onDragStart={e=>e.dataTransfer.setData("taskId", t.id)} className="bg-white/5 border border-white/10 rounded-xl p-3 cursor-move hover:border-accent/40 hover:bg-white/10 transition">
                  <div className="font-medium text-slate-100">{t.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{t.priority} {t.dueDate ? `· ${new Date(t.dueDate).toLocaleDateString()}` : ""}</div>
                  {(t.subtasks||[]).length>0 && <div className="text-xs text-cyan mt-1">Subtasks: {t.subtasks.length}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <GlassCard className="p-0 overflow-hidden">
        <div className="divide-y divide-white/10">
          {tasks.filter(t=>!t.parentId).map((t:any)=> (
            <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-white/5 transition">
              <select className={`${inputCls} text-sm sm:w-44`} value={t.status} onChange={e=>move(t.id,e.target.value)}>{STATUSES.map(s=><option key={s} value={s} className="bg-deep">{s}</option>)}</select>
              <div className="flex-1"><div className="font-medium text-white">{t.title}</div><div className="text-xs text-slate-400">{t.priority} {t.dueDate ? `· due ${new Date(t.dueDate).toLocaleDateString()}`:""}</div></div>
            </div>
          ))}
          {tasks.filter(t=>!t.parentId).length===0 && <div className="p-6 text-slate-400">No tasks yet.</div>}
        </div>
      </GlassCard>
    )}
  </AppLayout>;
}
