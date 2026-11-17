import { apiRequest } from "../../services/apiClient";
const qs = (p?: any) => p ? "?" + new URLSearchParams(Object.entries(p).filter(([_, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)])).toString() : "";
export const feedbackApi = {
  list: (p?: any) => apiRequest<any>(`/feedback${qs(p)}`),
  create: (data: any) => apiRequest<any>("/feedback", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/feedback/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiRequest<any>(`/feedback/${id}`, { method: "DELETE" }),
};