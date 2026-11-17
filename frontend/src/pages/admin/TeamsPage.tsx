import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { teamsApi } from "../../features/teams/api";

export function TeamsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = async () => { try { const res = await teamsApi.list(); setItems(res.data?.items || res.data || []); } catch(e:any){ setError(e.message);} };
  useEffect(()=>{ load(); },[]);
  const create = async (e:any)=>{ e.preventDefault(); setError(null); try { await teamsApi.create({ name }); setName(""); load(); } catch(e:any){ setError(e.message);} };
  return <AppLayout>
    <PageHeader title="Teams" subtitle="Organize members into teams and track collaboration." />
    {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{error}</div>}
    <GlassCard className="mb-6">
      <form onSubmit={create} className="flex flex-col sm:flex-row gap-3">
        <input className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="Team name" value={name} onChange={e=>setName(e.target.value)} />
        <button className="bg-gradient-to-r from-accent to-violet text-white px-5 py-2.5 rounded-xl shadow-neon hover:opacity-95 transition font-medium">Create Team</button>
      </form>
    </GlassCard>
    {items.length === 0 ? <EmptyState title="No teams yet" description="Create a team to start grouping members." /> : (
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((t:any)=>(
          <GlassCard key={t.id}>
            <div className="font-semibold text-white text-lg mb-1">{t.name}</div>
            <div className="text-sm text-slate-400">Members: <span className="text-cyan font-medium">{(t.members||[]).length}</span></div>
          </GlassCard>
        ))}
      </div>
    )}
  </AppLayout>;
}
