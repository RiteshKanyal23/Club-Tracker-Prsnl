import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { meetingsApi } from "../../features/meetings/api";

export function MeetingsPage(){
  const [items,setItems]=useState<any[]>([]); const [title,setTitle]=useState(""); const [scheduledAt,setScheduledAt]=useState(""); const [selected,setSelected]=useState<any>(null); const [minutes,setMinutes]=useState(""); const [actionTitle,setActionTitle]=useState(""); const [projectId,setProjectId]=useState(""); const [err,setErr]=useState<string|null>(null);
  const load=async()=>{ try{ const r=await meetingsApi.list(); setItems(r.data||[]);}catch(e:any){setErr(e.message);} };
  useEffect(()=>{load();},[]);
  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40";
  return <AppLayout>
    <PageHeader title="Meetings" subtitle="Schedule meetings, capture minutes, and track action items." />
    {err && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{err}</div>}
    <GlassCard className="mb-6">
      <form className="flex flex-wrap gap-3" onSubmit={async(e)=>{e.preventDefault(); if(!title||!scheduledAt) return; await meetingsApi.create({title, scheduledAt: new Date(scheduledAt).toISOString()}); setTitle(""); setScheduledAt(""); load();}}>
        <input className={`${inputCls} flex-1 min-w-[220px]`} placeholder="Meeting title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className={inputCls} type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} />
        <button className="bg-gradient-to-r from-accent to-violet text-white px-5 py-2 rounded-xl shadow-neon hover:opacity-95 font-medium">Schedule</button>
      </form>
    </GlassCard>
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        {items.map((m:any)=>(
          <GlassCard key={m.id} className={`cursor-pointer transition ${selected?.id===m.id?"ring-2 ring-accent/50 border-accent/40":""}`} hover={false}>
            <div onClick={async()=>{setSelected(m); const mm=await meetingsApi.minutes(m.id); setMinutes(mm.data?.[0]?.content||m.minutes?.content||"");}}>
              <div className="font-medium text-white">{m.title}</div>
              <div className="text-sm text-slate-400 mt-1">{new Date(m.scheduledAt).toLocaleString()}</div>
            </div>
          </GlassCard>
        ))}
        {items.length===0 && <div className="text-slate-400">No meetings scheduled.</div>}
      </div>
      <GlassCard>
        {!selected ? <p className="text-slate-400">Select a meeting to view minutes and action items.</p> : <>
          <h2 className="font-semibold text-white mb-3">Minutes & Action Items</h2>
          <textarea className={`${inputCls} w-full mb-3`} rows={6} placeholder="Meeting minutes..." value={minutes} onChange={e=>setMinutes(e.target.value)} />
          <button className="glass border border-white/10 text-slate-200 px-4 py-2 rounded-xl hover:text-white mb-4" onClick={async()=>{await meetingsApi.saveMinutes({meetingId:selected.id, content: minutes}); load();}}>Save Minutes</button>
          <div className="flex gap-2 mb-2"><input className={`${inputCls} flex-1`} placeholder="Action item title" value={actionTitle} onChange={e=>setActionTitle(e.target.value)} /><button className="bg-gradient-to-r from-accent to-violet text-white px-4 py-2 rounded-xl" onClick={async()=>{if(!actionTitle) return; await meetingsApi.createAction({meetingId:selected.id, title: actionTitle}); setActionTitle(""); load();}}>Add</button></div>
          <div className="mb-3"><input className={`${inputCls} w-full`} placeholder="Project ID (for convert)" value={projectId} onChange={e=>setProjectId(e.target.value)} /></div>
          <ul className="text-sm space-y-2">{(items.find(i=>i.id===selected.id)?.actionItems||selected.actionItems||[]).map((a:any)=>(<li key={a.id} className="flex justify-between items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10"><span className="text-slate-200">{a.title} <span className="text-slate-500">({a.status})</span></span>{!a.taskId && projectId && <button className="text-cyan hover:underline text-xs" onClick={async()=>{await meetingsApi.convertAction(a.id, projectId); load();}}>Convert to task</button>}</li>))}</ul>
        </>}
      </GlassCard>
    </div>
  </AppLayout>;
}
