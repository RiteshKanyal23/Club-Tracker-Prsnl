import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { announcementsApi } from "../../features/announcements/api";
import { useAuthStore } from "../../store/auth.store";

export function AnnouncementsPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "ADMIN" || user?.role === "COORDINATOR";
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState(""); const [content, setContent] = useState(""); const [pinned, setPinned] = useState(false); const [targetRoles, setTargetRoles] = useState("");
  const [error, setError] = useState<string|null>(null);
  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 w-full";

  const load = async () => { try { const r = await announcementsApi.list(); setItems(r.data || []); } catch(e:any){ setError(e.message); } };
  useEffect(()=>{ load(); },[]);

  const isRead = (a:any)=> (a.receipts||[]).some((r:any)=>r.userId===user?.id);

  return <AppLayout>
    <PageHeader title="Announcements" subtitle="Share and track important updates across the workspace." />
    {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{error}</div>}
    {canManage && <GlassCard className="mb-6">
      <form className="space-y-3" onSubmit={async(e)=>{e.preventDefault(); if(!title||!content) return; await announcementsApi.create({title,content,pinned,targetRoles: targetRoles?targetRoles.split(",").map(s=>s.trim()).filter(Boolean):[]}); setTitle(""); setContent(""); setPinned(false); setTargetRoles(""); load();}}>
        <div className="font-semibold text-white">New Announcement</div>
        <input className={inputCls} placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <textarea className={inputCls} rows={3} placeholder="Content" value={content} onChange={e=>setContent(e.target.value)} />
        <div className="flex gap-3 items-center flex-wrap text-slate-200"><label className="flex gap-2 items-center"><input type="checkbox" className="accent-cyan" checked={pinned} onChange={e=>setPinned(e.target.checked)} /> Pinned</label><input className={`${inputCls} flex-1 min-w-[220px]`} placeholder="Target roles (comma, e.g. MEMBER,TEAM_LEADER)" value={targetRoles} onChange={e=>setTargetRoles(e.target.value)} /></div>
        <button className="bg-gradient-to-r from-accent to-violet text-white px-5 py-2 rounded-xl shadow-neon hover:opacity-95">Publish</button>
      </form>
    </GlassCard>}

    <div className="space-y-4">{items.map((a:any)=> (
      <GlassCard key={a.id} className={a.pinned?"ring-1 ring-amber-400/40":""}>
        <div className="flex justify-between items-start gap-3"><div><div className="font-semibold text-white flex items-center gap-2">{a.pinned && <span className="text-amber-300 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">Pinned</span>}{a.title}</div><div className="text-xs text-slate-500 mt-1">{new Date(a.createdAt).toLocaleString()} · Targets: {(a.targetRoles||[]).length? a.targetRoles.join(", "): "All"} {a.targetTeams?.length? ` · Teams: ${a.targetTeams.join(",")}`:""}</div></div>
          <div className="flex gap-3 text-sm shrink-0">{!isRead(a) ? <button className="text-cyan hover:underline" onClick={async()=>{await announcementsApi.markRead(a.id); load();}}>Mark read</button> : <span className="text-emerald-400">Read</span>}{canManage && <button className="text-rose-300 hover:underline" onClick={async()=>{await announcementsApi.remove(a.id); load();}}>Delete</button>}</div>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-slate-300">{a.content}</p>
        {canManage && <div className="text-xs text-slate-500 mt-2">Read receipts: {(a.receipts||[]).length}</div>}
      </GlassCard>
    ))}{items.length===0 && <div className="text-slate-400">No announcements yet.</div>}</div>
  </AppLayout>;
}
