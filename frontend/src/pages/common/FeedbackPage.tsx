import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { feedbackApi } from "../../features/feedback/api";
import { useAuthStore } from "../../store/auth.store";

export function FeedbackPage() {
  const user = useAuthStore((s) => s.user);
  const privileged = ["ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"].includes(user?.role || "");
  const [items, setItems] = useState<any[]>([]);
  const [comment, setComment] = useState(""); const [rating, setRating] = useState<number| "">(""); const [toUserId, setToUserId] = useState("");
  const [error, setError] = useState<string|null>(null);
  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 w-full";

  const load = async ()=>{ try{ const r = await feedbackApi.list(); setItems(r.data||[]);}catch(e:any){ setError(e.message); } };
  useEffect(()=>{ load(); },[]);

  return <AppLayout>
    <PageHeader title="Feedback" subtitle="Submit feedback and track responses across the team." />
    {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{error}</div>}
    <GlassCard className="mb-6">
      <form className="space-y-3" onSubmit={async(e)=>{e.preventDefault(); if(!comment) return; await feedbackApi.create({ comment, rating: rating===""?undefined:Number(rating), toUserId: toUserId||undefined }); setComment(""); setRating(""); setToUserId(""); load(); }}>
        <div className="font-semibold text-white">Submit Feedback</div>
        <input className={inputCls} placeholder="To User ID (optional)" value={toUserId} onChange={e=>setToUserId(e.target.value)} />
        <select className={inputCls} value={rating} onChange={e=>setRating(e.target.value?Number(e.target.value):"")}><option value="" className="bg-deep">Rating (optional)</option>{[1,2,3,4,5].map(n=><option key={n} value={n} className="bg-deep">{n}</option>)}</select>
        <textarea className={inputCls} rows={3} placeholder="Comment" value={comment} onChange={e=>setComment(e.target.value)} />
        <button className="bg-gradient-to-r from-accent to-violet text-white px-5 py-2 rounded-xl shadow-neon">Submit</button>
      </form>
    </GlassCard>
    <div className="space-y-3">{items.map((f:any)=> (
      <GlassCard key={f.id}>
        <div className="flex justify-between gap-3 flex-wrap"><div><div className="font-medium text-white">From: {f.fromUser?.name || f.fromUserId} {f.toUser ? `→ ${f.toUser.name}`:""}</div><div className="text-xs text-slate-500 mt-1">{new Date(f.createdAt).toLocaleString()} · Status: <span className="text-cyan">{f.status}</span> {f.rating ? `· Rating: ${f.rating}/5`:""}</div></div>
          {(privileged || f.fromUserId===user?.id) && <button className="text-sm text-rose-300 hover:underline" onClick={async()=>{await feedbackApi.remove(f.id); load();}}>Delete</button>}
        </div>
        <p className="mt-2 whitespace-pre-wrap text-slate-300">{f.comment}</p>
        {f.response && <div className="mt-3 text-sm bg-white/5 border border-white/10 p-3 rounded-xl text-slate-200"><span className="font-medium text-white">Response:</span> {f.response}</div>}
        {privileged && <div className="mt-3 flex gap-2 flex-wrap">
          <button className="glass border border-white/10 px-3 py-1.5 rounded-xl text-sm text-slate-200 hover:text-white" onClick={async()=>{await feedbackApi.update(f.id,{status:"REVIEWED"}); load();}}>Mark Reviewed</button>
          <button className="bg-gradient-to-r from-accent to-violet text-white px-3 py-1.5 rounded-xl text-sm" onClick={async()=>{const r=prompt("Response (optional)"); await feedbackApi.update(f.id,{status:"RESOLVED", response:r||undefined}); load();}}>Resolve/Respond</button>
        </div>}
      </GlassCard>
    ))}{items.length===0 && <div className="text-slate-400">No feedback yet.</div>}</div>
  </AppLayout>;
}
