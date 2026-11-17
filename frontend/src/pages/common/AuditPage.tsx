import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { auditApi } from "../../features/audit/api";

export function AuditPage() {
  const [items, setItems] = useState<any[]>([]);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [error, setError] = useState<string|null>(null);
  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40";

  const load = async ()=>{ try{ const r = await auditApi.list({ entityType: entityType||undefined, action: action||undefined, limit: 100 }); setItems(r.data?.items || r.data || []);}catch(e:any){ setError(e.message); } };
  useEffect(()=>{ load(); },[]);

  return <AppLayout>
    <PageHeader title="Audit Logs" subtitle="Review system activity, changes, and security-relevant events." />
    {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{error}</div>}
    <GlassCard className="mb-4">
      <div className="flex flex-wrap gap-3 items-end"><input className={inputCls} placeholder="Entity type" value={entityType} onChange={e=>setEntityType(e.target.value)} /><input className={inputCls} placeholder="Action contains" value={action} onChange={e=>setAction(e.target.value)} /><button className="bg-gradient-to-r from-accent to-violet text-white px-4 py-2 rounded-xl shadow-neon" onClick={load}>Filter</button><a className="text-cyan hover:underline text-sm px-2 py-2" href={auditApi.exportUrl({entityType:entityType||undefined, action:action||undefined})} target="_blank" rel="noreferrer">Export CSV</a></div>
    </GlassCard>
    <div className="grid lg:grid-cols-2 gap-4">
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-auto max-h-[560px]"><table className="w-full text-sm"><thead className="bg-white/5 sticky top-0"><tr className="text-left text-slate-400"><th className="p-3">Time</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">Entity</th></tr></thead><tbody>{items.map((l:any)=>(<tr key={l.id} className="border-t border-white/10 cursor-pointer hover:bg-white/5 text-slate-200" onClick={async()=>{ try{ const r=await auditApi.get(l.id); setSelected(r.data||l);}catch{ setSelected(l);} }}><td className="p-3 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td><td className="p-3">{l.actor?.email || l.actorId || "—"}</td><td className="p-3 text-cyan">{l.action}</td><td className="p-3">{l.entityType} {l.entityId || ""}</td></tr>))}{items.length===0 && <tr><td colSpan={4} className="p-4 text-slate-400">No audit logs found.</td></tr>}</tbody></table></div>
      </GlassCard>
      <GlassCard className="overflow-auto max-h-[560px]"><h2 className="font-semibold text-white mb-3">Details</h2>{!selected ? <p className="text-slate-400">Select a log entry</p> : <pre className="text-xs whitespace-pre-wrap text-slate-300 bg-white/5 border border-white/10 rounded-xl p-3">{JSON.stringify(selected, null, 2)}</pre>}</GlassCard>
    </div>
  </AppLayout>;
}
