import { apiRequest } from "../../services/apiClient";
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";
export const documentsApi = {
  list: (p?:any)=>{ const qs=p?"?"+new URLSearchParams(Object.entries(p).filter(([_,v])=>v!=null&&v!=="").map(([k,v])=>[k,String(v)])).toString():""; return apiRequest<any>(`/documents${qs}`); },
  folders: (p?:any)=>{ const qs=p?"?"+new URLSearchParams(Object.entries(p).filter(([_,v])=>v!=null&&v!=="").map(([k,v])=>[k,String(v)])).toString():""; return apiRequest<any>(`/documents/folders${qs}`); },
  createFolder: (data:any)=>apiRequest<any>("/documents/folders",{method:"POST",body:JSON.stringify(data)}),
  upload: async (data:{title:string;folderId?:string;projectId?:string;teamId?:string;file:File})=>{
    const form = new FormData();
    form.append("title", data.title);
    if(data.folderId) form.append("folderId", data.folderId);
    if(data.projectId) form.append("projectId", data.projectId);
    if(data.teamId) form.append("teamId", data.teamId);
    form.append("file", data.file);
    const res = await fetch(`${BASE}/documents`, { method:"POST", body: form, credentials:"include" });
    return res.json();
  },
  downloadUrl: (documentId:string)=>`${BASE}/documents/${documentId}/download`,
};
