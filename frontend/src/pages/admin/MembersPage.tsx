import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { membersApi } from "../../features/members/api";

export function MembersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [skill, setSkill] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = async (s?: string) => { try { const res = await membersApi.list(s ? { skill: s } : undefined); setItems(res.data?.items || res.data || []); } catch(e:any){ setError(e.message);} };
  useEffect(()=>{ load(); },[]);
  return <AppLayout>
    <PageHeader title="Members" subtitle="Browse members, roles, and skills." />
    {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{error}</div>}
    <GlassCard className="mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
          <Search size={16} className="text-slate-400" />
          <input className="bg-transparent outline-none text-slate-200 placeholder:text-slate-500 w-full" placeholder="Filter by skill" value={skill} onChange={e=>setSkill(e.target.value)} />
        </div>
        <button className="bg-gradient-to-r from-accent to-violet text-white px-5 py-2.5 rounded-xl shadow-neon hover:opacity-95 transition font-medium" onClick={()=>load(skill)}>Search</button>
      </div>
    </GlassCard>
    {items.length === 0 ? <EmptyState title="No members found" description="Try adjusting your filters or add members to the workspace." /> : (
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((m:any)=>(
          <GlassCard key={m.id}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-violet flex items-center justify-center text-white font-semibold">{(m.user?.name||"?").charAt(0).toUpperCase()}</div>
              <div><div className="font-semibold text-white">{m.user?.name || m.id}</div><div className="text-xs text-slate-400">{m.user?.email}</div></div>
            </div>
            <div className="text-xs inline-flex px-2 py-1 rounded-full bg-white/5 border border-white/10 text-cyan mb-2">{m.user?.role}</div>
            <div className="text-sm text-slate-400">Skills: <span className="text-slate-300">{(m.skills||[]).map((s:any)=>`${s.name}(${s.proficiency})`).join(", ") || "—"}</span></div>
          </GlassCard>
        ))}
      </div>
    )}
  </AppLayout>;
}
