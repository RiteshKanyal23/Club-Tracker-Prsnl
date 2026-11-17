import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { achievementsApi } from "../../features/achievements/api";
import { membersApi } from "../../features/members/api";
import { useAuthStore } from "../../store/auth.store";

export function AchievementsPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = ["ADMIN","COORDINATOR","TEAM_LEADER"].includes(user?.role || "");
  const [achievements, setAchievements] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [form, setForm] = useState({ name:"", description:"", points:10 });
  const [memberId, setMemberId] = useState("");
  const [achievementId, setAchievementId] = useState("");
  const [error, setError] = useState<string|null>(null);
  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 w-full";

  const load = async ()=>{ try{ const [a,aw,m] = await Promise.all([achievementsApi.list(), achievementsApi.awards(), membersApi.list({limit:100})]); setAchievements(a.data||[]); setAwards(aw.data||[]); setMembers(m.data?.items||m.data||[]); }catch(e:any){ setError(e.message); } };
  useEffect(()=>{ load(); },[]);

  return <AppLayout>
    <PageHeader title="Achievements & Recognition" subtitle="Celebrate milestones, awards, and team accomplishments." />
    {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{error}</div>}
    <div className="grid lg:grid-cols-2 gap-4">
      <GlassCard>
        <h2 className="font-semibold text-white mb-3">Achievement Catalog</h2>
        <div className="space-y-2 mb-4 max-h-72 overflow-auto pr-1">{achievements.map((a:any)=>(<div key={a.id} className="border border-white/10 rounded-xl p-3 bg-white/5"><div className="font-medium text-white flex items-center justify-between">{a.name} <span className="text-xs text-cyan">({a.points} pts)</span></div><div className="text-sm text-slate-400 mt-1">{a.description || a.criteriaKey || "—"}</div><div className="text-xs text-slate-500 mt-1">Awards: {a._count?.awards ?? 0}</div></div>))}{achievements.length===0 && <div className="text-slate-400">No achievements defined.</div>}</div>
        {canManage && <form className="space-y-2 border-t border-white/10 pt-3" onSubmit={async(e)=>{e.preventDefault(); if(!form.name) return; await achievementsApi.create({name:form.name, description:form.description||undefined, points:Number(form.points)||0}); setForm({name:"",description:"",points:10}); load();}}>
          <div className="font-medium text-white">Create Achievement</div>
          <input className={inputCls} placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <input className={inputCls} placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          <input className={inputCls} type="number" placeholder="Points" value={form.points} onChange={e=>setForm({...form,points:Number(e.target.value)})} />
          <button className="bg-gradient-to-r from-accent to-violet text-white px-4 py-2 rounded-xl shadow-neon">Create</button>
        </form>}
      </GlassCard>
      <GlassCard>
        <h2 className="font-semibold text-white mb-3">Awards</h2>
        {canManage && <div className="space-y-2 mb-4 border-b border-white/10 pb-4">
          <select className={inputCls} value={memberId} onChange={e=>setMemberId(e.target.value)}><option value="" className="bg-deep">Select member</option>{members.map((m:any)=>(<option key={m.id} value={m.id} className="bg-deep">{m.user?.name || m.user?.email || m.id}</option>))}</select>
          <select className={inputCls} value={achievementId} onChange={e=>setAchievementId(e.target.value)}><option value="" className="bg-deep">Select achievement</option>{achievements.map((a:any)=>(<option key={a.id} value={a.id} className="bg-deep">{a.name}</option>))}</select>
          <div className="flex gap-2"><button className="bg-gradient-to-r from-accent to-violet text-white px-4 py-2 rounded-xl shadow-neon" onClick={async()=>{ if(!memberId||!achievementId) return; await achievementsApi.award({memberId, achievementId}); load(); }}>Award</button><button className="glass border border-white/10 text-slate-200 px-4 py-2 rounded-xl" onClick={async()=>{ if(!memberId) return; await achievementsApi.evaluate(memberId); load(); }}>Auto-evaluate</button></div>
        </div>}
        <div className="space-y-2 max-h-96 overflow-auto pr-1">{awards.map((aw:any)=>(<div key={aw.id} className="border border-white/10 rounded-xl p-3 bg-white/5"><div className="font-medium text-white">{aw.member?.user?.name || aw.memberId} → {aw.achievement?.name}</div><div className="text-xs text-slate-500 mt-1">{new Date(aw.awardedAt).toLocaleString()} {aw.note ? `· ${aw.note}`:""}</div></div>))}{awards.length===0 && <div className="text-slate-400 text-sm">No awards yet.</div>}</div>
      </GlassCard>
    </div>
  </AppLayout>;
}
