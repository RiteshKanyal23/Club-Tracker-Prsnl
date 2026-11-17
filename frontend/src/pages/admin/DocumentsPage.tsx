import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { documentsApi } from "../../features/documents/api";

export function DocumentsPage(){
  const [docs,setDocs]=useState<any[]>([]); const [folders,setFolders]=useState<any[]>([]); const [title,setTitle]=useState(""); const [file,setFile]=useState<File|null>(null); const [folderName,setFolderName]=useState(""); const [err,setErr]=useState<string|null>(null);
  const load=async()=>{ try{ const [d,f]=await Promise.all([documentsApi.list(), documentsApi.folders()]); setDocs(d.data||[]); setFolders(f.data||[]);}catch(e:any){setErr(e.message);} };
  useEffect(()=>{load();},[]);
  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 w-full";
  return <AppLayout>
    <PageHeader title="Documents" subtitle="Manage folders, upload documents, and access files." />
    {err && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-2">{err}</div>}
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      <GlassCard>
        <form className="space-y-3" onSubmit={async(e)=>{e.preventDefault(); if(!folderName) return; await documentsApi.createFolder({name:folderName}); setFolderName(""); load();}}>
          <div className="font-semibold text-white">Create Folder</div>
          <input className={inputCls} placeholder="Folder name" value={folderName} onChange={e=>setFolderName(e.target.value)} />
          <button className="bg-gradient-to-r from-accent to-violet text-white px-4 py-2 rounded-xl shadow-neon hover:opacity-95">Create</button>
        </form>
      </GlassCard>
      <GlassCard>
        <form className="space-y-3" onSubmit={async(e)=>{e.preventDefault(); if(!title||!file) return; await documentsApi.upload({title,file}); setTitle(""); setFile(null); load();}}>
          <div className="font-semibold text-white">Upload Document</div>
          <input className={inputCls} placeholder="Document title" value={title} onChange={e=>setTitle(e.target.value)} />
          <input type="file" className="text-sm text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-white/10 file:text-slate-200" onChange={e=>setFile(e.target.files?.[0]||null)} />
          <button className="bg-gradient-to-r from-accent to-violet text-white px-4 py-2 rounded-xl shadow-neon hover:opacity-95">Upload</button>
        </form>
      </GlassCard>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <GlassCard><h2 className="font-semibold text-white mb-3">Folders</h2><ul className="space-y-2">{folders.map((f:any)=><li key={f.id} className="border border-white/10 rounded-xl p-3 bg-white/5 text-slate-200">{f.name}</li>)}{folders.length===0 && <li className="text-slate-400">No folders.</li>}</ul></GlassCard>
      <GlassCard><h2 className="font-semibold text-white mb-3">Documents</h2><ul className="space-y-2">{docs.map((d:any)=>(<li key={d.id} className="border border-white/10 rounded-xl p-3 bg-white/5 flex justify-between items-center gap-2"><span className="text-slate-200">{d.title} <span className="text-xs text-slate-500">v{d.versions?.[0]?.version||1}</span></span><a className="text-cyan hover:underline text-sm" href={documentsApi.downloadUrl(d.id)} target="_blank" rel="noreferrer">Open/Download</a></li>))}{docs.length===0 && <li className="text-slate-400">No documents.</li>}</ul></GlassCard>
    </div>
  </AppLayout>;
}
