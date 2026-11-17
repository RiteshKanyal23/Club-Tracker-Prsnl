import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { leaveApi } from "../../features/leave/api";

export function LeavePage(){
  const [items,setItems]=useState<any[]>([]); const [memberId,setMemberId]=useState(""); const [startDate,setStartDate]=useState(""); const [endDate,setEndDate]=useState(""); const [reason,setReason]=useState(""); const [err,setErr]=useState<string|null>(null);
  const load=async()=>{ try{ const r=await leaveApi.list(); setItems(r.data||[]);}catch(e:any){setErr(e.message);} };
  useEffect(()=>{load();},[]);
  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40";
  return <AppLayout>
    <PageHeader title="Leave Management" subtitle="Apply for leave, review requests, and track approvals." />
    {err && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{err}</div>}
    <GlassCard className="mb-6">
      <form className="grid md:grid-cols-5 gap-3" onSubmit={async(e)=>{e.preventDefault(); if(!memberId||!startDate||!endDate||!reason) return; await leaveApi.apply({memberId,startDate,endDate,reason}); setReason(""); load();}}>
        <input className={inputCls} placeholder="Member ID" value={memberId} onChange={e=>setMemberId(e.target.value)} />
        <input className={inputCls} type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
        <input className={inputCls} type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
        <input className={inputCls} placeholder="Reason" value={reason} onChange={e=>setReason(e.target.value)} />
        <button className="bg-gradient-to-r from-accent to-violet text-white px-4 py-2 rounded-xl shadow-neon hover:opacity-95 font-medium">Apply</button>
      </form>
    </GlassCard>
    <div className="space-y-3">
      {items.map((r:any)=>(
        <GlassCard key={r.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3" hover={false}>
          <div>
            <div className="font-medium text-white flex items-center gap-2 flex-wrap">{r.member?.user?.name||r.memberId} <span className={`text-xs px-2 py-0.5 rounded-full border ${r.status==="APPROVED"?"bg-emerald-500/15 text-emerald-300 border-emerald-500/30":r.status==="REJECTED"?"bg-rose-500/15 text-rose-300 border-rose-500/30":"bg-amber-500/15 text-amber-300 border-amber-500/30"}`}>{r.status}</span></div>
            <div className="text-sm text-slate-400 mt-1">{new Date(r.startDate).toLocaleDateString()} to {new Date(r.endDate).toLocaleDateString()} · {r.reason}</div>
            {r.remarks && <div className="text-xs text-slate-500 mt-1">Remarks: {r.remarks}</div>}
          </div>
          {r.status==="PENDING" && <div className="flex gap-2 shrink-0"><button className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-sm" onClick={async()=>{await leaveApi.review(r.id,{status:"APPROVED"}); load();}}>Approve</button><button className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-sm" onClick={async()=>{await leaveApi.review(r.id,{status:"REJECTED", remarks:"Not approved"}); load();}}>Reject</button></div>}
        </GlassCard>
      ))}
      {items.length===0 && <div className="text-slate-400">No leave requests found.</div>}
    </div>
  </AppLayout>;
}
