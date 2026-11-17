import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { knowledgeApi } from "../../features/knowledge/api";

export function KnowledgePage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState(""); const [category, setCategory] = useState(""); const [tag, setTag] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ title:"", content:"", category:"", tags:"", published:true });
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 w-full";

  const load = async ()=>{ try{ const r = await knowledgeApi.list({ search: search||undefined, category: category||undefined, tag: tag||undefined }); setItems(r.data||[]);}catch(e:any){setError(e.message);} };
  useEffect(()=>{ load(); },[]);

  const save = async ()=>{ const payload = { title: form.title, content: form.content, category: form.category||undefined, tags: form.tags? form.tags.split(",").map(s=>s.trim()).filter(Boolean):[], published: form.published };
    if (selected) await knowledgeApi.update(selected.id, payload); else await knowledgeApi.create(payload);
    setSelected(null); setForm({title:"",content:"",category:"",tags:"",published:true}); load();
  };

  return <AppLayout>
    <PageHeader title="Knowledge Base" subtitle="Create, search, and share documentation and guides." />
    {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{error}</div>}
    <GlassCard className="mb-4">
      <div className="flex flex-wrap gap-3"><input className={`${inputCls} sm:w-64`} placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} /><input className={`${inputCls} sm:w-48`} placeholder="Category" value={category} onChange={e=>setCategory(e.target.value)} /><input className={`${inputCls} sm:w-48`} placeholder="Tag" value={tag} onChange={e=>setTag(e.target.value)} /><button className="bg-gradient-to-r from-accent to-violet text-white px-5 py-2 rounded-xl shadow-neon" onClick={load}>Search</button></div>
    </GlassCard>
    <div className="grid lg:grid-cols-2 gap-4">
      <GlassCard>
        <div className="flex justify-between items-center mb-3"><h2 className="font-semibold text-white">Articles</h2><button className="text-sm text-cyan hover:underline" onClick={()=>{setSelected(null); setForm({title:"",content:"",category:"",tags:"",published:true});}}>New</button></div>
        <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
          {items.map((a:any)=> (
            <div key={a.id} className={`border rounded-xl p-3 cursor-pointer transition ${selected?.id===a.id?"border-accent/40 bg-accent/10":"border-white/10 bg-white/5 hover:bg-white/10"}`} onClick={()=>{setSelected(a); setForm({title:a.title, content:a.content, category:a.category||"", tags:(a.tags||[]).join(", "), published:a.published});}}>
              <div className="font-medium text-white">{a.title}</div>
              <div className="text-xs text-slate-500 mt-1">{a.category || "Uncategorized"} · {(a.tags||[]).join(", ")} · by {a.author?.name || "Unknown"}</div>
            </div>
          ))}
          {items.length===0 && <div className="text-slate-400">No articles found.</div>}
        </div>
      </GlassCard>
      <GlassCard className="space-y-3">
        <div className="flex justify-between items-center"><h2 className="font-semibold text-white">{selected?"Edit Article":"New Article"} (Markdown)</h2><button className="text-sm text-cyan hover:underline" onClick={()=>setPreview(!preview)}>{preview?"Edit":"Preview"}</button></div>
        <input className={inputCls} placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
        <input className={inputCls} placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
        <input className={inputCls} placeholder="Tags (comma separated)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} />
        {!preview ? <textarea className={`${inputCls} font-mono`} rows={12} placeholder="Write markdown content..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})} /> : <div className="border border-white/10 rounded-xl p-3 min-h-[280px] whitespace-pre-wrap bg-white/5 text-slate-200">{form.content || "(empty)"}</div>}
        <label className="flex gap-2 items-center text-sm text-slate-200"><input type="checkbox" className="accent-cyan" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})} /> Published</label>
        <div className="flex gap-2"><button className="bg-gradient-to-r from-accent to-violet text-white px-4 py-2 rounded-xl shadow-neon" onClick={save}>Save</button>{selected && <button className="glass border border-white/10 text-rose-300 px-4 py-2 rounded-xl" onClick={async()=>{await knowledgeApi.remove(selected.id); setSelected(null); load();}}>Delete</button>}</div>
        <p className="text-xs text-slate-500">Supports markdown text (headings, lists, code, links). Preview shows formatted text baseline.</p>
      </GlassCard>
    </div>
  </AppLayout>;
}
