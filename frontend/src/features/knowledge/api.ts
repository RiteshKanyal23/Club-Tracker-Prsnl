import { apiRequest } from "../../services/apiClient";
const qs = (p?: any) => p ? "?" + new URLSearchParams(Object.entries(p).filter(([_, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)])).toString() : "";
export const knowledgeApi = {
  list: (p?: any) => apiRequest<any>(`/knowledge${qs(p)}`),
  get: (id: string) => apiRequest<any>(`/knowledge/${id}`),
  create: (data: any) => apiRequest<any>("/knowledge", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/knowledge/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiRequest<any>(`/knowledge/${id}`, { method: "DELETE" }),
};