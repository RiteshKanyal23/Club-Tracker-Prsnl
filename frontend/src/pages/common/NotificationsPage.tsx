import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { notificationsApi } from "../../features/notifications/api";
import { socket } from "../../services/socketClient";

export function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [prefs, setPrefs] = useState<any>(null);
  const [error, setError] = useState<string|null>(null);

  const load = async ()=>{ try{ const [n,p] = await Promise.all([notificationsApi.list(false), notificationsApi.getPrefs()]); setItems(n.data||[]); setPrefs(p.data||null);}catch(e:any){setError(e.message);} };
  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ const onNew=(n:any)=>setItems(prev=>[n,...prev]); socket.on("notification:new", onNew); return ()=>{socket.off("notification:new", onNew);}; },[]);

  const toggle = (k:string)=> setPrefs((prev:any)=>({...prev,[k]: !prev?.[k]}));

  return <AppLayout>
    <PageHeader title="Notifications" subtitle="View notifications and manage your preferences." actions={<button className="glass border border-white/10 text-slate-200 px-4 py-2 rounded-xl hover:text-white" onClick={async()=>{await notificationsApi.markAllRead(); load();}}>Mark all as read</button>} />
    {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{error}</div>}
    <div className="grid lg:grid-cols-3 gap-4">
      <GlassCard className="lg:col-span-2">
        <h2 className="font-semibold text-white mb-3">Notification Center</h2>
        <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
          {items.map((n:any)=> (
            <div key={n.id} className={`border border-white/10 rounded-xl p-3 bg-white/5 ${n.readAt?"opacity-70":""}`}>
              <div className="flex justify-between gap-2"><div className="font-medium text-white">{n.title}</div><div className="text-xs text-slate-500 whitespace-nowrap">{new Date(n.createdAt).toLocaleString()}</div></div>
              {n.body && <div className="text-sm text-slate-300 mt-1">{n.body}</div>}
              <div className="text-xs text-slate-500 mt-2 flex items-center justify-between"><span>Type: {n.type}</span>{!n.readAt && <button className="text-cyan hover:underline" onClick={async()=>{await notificationsApi.markRead(n.id); load();}}>Mark read</button>}</div>
            </div>
          ))}
          {items.length===0 && <div className="text-slate-400">No notifications yet.</div>}
        </div>
      </GlassCard>
      <GlassCard>
        <h2 className="font-semibold text-white mb-3">Preferences</h2>
        {!prefs ? <div className="text-slate-400">Loading...</div> : <div className="space-y-3 text-sm">
          {[["inApp","In-app notifications"],["email","Email notifications"],["taskUpdates","Task updates"],["meetingReminders","Meeting reminders"],["announcements","Announcements"]].map(([k,label])=> (
            <label key={k} className="flex items-center gap-3 text-slate-200"><input type="checkbox" className="accent-cyan w-4 h-4" checked={!!prefs[k]} onChange={()=>toggle(k)} /> {label}</label>
          ))}
          <button className="mt-2 w-full bg-gradient-to-r from-accent to-violet text-white px-4 py-2 rounded-xl shadow-neon hover:opacity-95" onClick={async()=>{await notificationsApi.updatePrefs({inApp:prefs.inApp,email:prefs.email,taskUpdates:prefs.taskUpdates,meetingReminders:prefs.meetingReminders,announcements:prefs.announcements}); load();}}>Save Preferences</button>
        </div>}
      </GlassCard>
    </div>
  </AppLayout>;
}
