import { apiRequest } from "../../services/apiClient";
import { API_BASE_URL } from "../../config/api";
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
    return apiRequest<any>("/documents", { method:"POST", body: form });
  },
  downloadUrl: (documentId:string)=>`${API_BASE_URL}/documents/${documentId}/download`,
};
