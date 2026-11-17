import { apiRequest } from "../../services/apiClient";

export const projectsApi = {
  list: (params?: Record<string, any>) => {
    const qs = params ? "?" + new URLSearchParams(Object.entries(params).filter(([_,v])=>v!=null && v!=="").map(([k,v])=>[k,String(v)])).toString() : "";
    return apiRequest<any>(`/projects${qs}`);
  },
  get: (id: string) => apiRequest<any>(`/projects/${id}`),
  create: (data: any) => apiRequest<any>("/projects", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiRequest<any>(`/projects/${id}`, { method: "DELETE" }),
  history: (projectId: string) => apiRequest<any>(`/project-history?projectId=${encodeURIComponent(projectId)}`),
};
