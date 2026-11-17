import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { projectsApi } from "../../features/projects/api";

export function ProjectsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { const res = await projectsApi.list(); setItems(res.data?.items || res.data || []); } catch (e:any){ setError(e.message);} finally { setLoading(false); } };
  useEffect(()=>{ load(); },[]);
  const create = async (e:any)=>{ e.preventDefault(); setError(null); try { await projectsApi.create({ name, status: "PLANNING" }); setName(""); load(); } catch(e:any){ setError(e.message);} };
  return <AppLayout>
    <PageHeader title="Projects" subtitle="Create and manage projects across the workspace." />
    {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{error}</div>}
    <GlassCard className="mb-6">
      <form onSubmit={create} className="flex flex-col sm:flex-row gap-3">
        <input className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="Project name" value={name} onChange={e=>setName(e.target.value)} />
        <button className="bg-gradient-to-r from-accent to-violet text-white px-5 py-2.5 rounded-xl shadow-neon hover:opacity-95 transition font-medium">Create Project</button>
      </form>
    </GlassCard>
    {loading ? <div className="text-slate-400">Loading projects...</div> : items.length === 0 ? <EmptyState title="No projects yet" description="Create your first project to get started." /> : (
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((p:any)=>(
          <GlassCard key={p.id} className="h-full">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="font-semibold text-white text-lg">{p.name}</div>
              <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-cyan border border-accent/30">{p.status}</span>
            </div>
            <div className="text-sm text-slate-400 mb-3">{p.deadline ? `Due ${new Date(p.deadline).toLocaleDateString()}` : "No deadline set"}</div>
            <div className="text-xs text-slate-500">Recent history: {(p.history||[]).slice(0,3).map((h:any)=>h.action).join(", ") || "—"}</div>
          </GlassCard>
        ))}
      </div>
    )}
  </AppLayout>;
}
