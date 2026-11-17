import { apiRequest } from "../../services/apiClient";

function qs(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") q.set(k, String(v)); });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const analyticsApi = {
  overview: () => apiRequest<any>("/analytics/overview"),
  workload: (params: { days?: number; range?: string } = {}) => apiRequest<any>(`/analytics/workload${qs(params)}`),
  trends: (params: number | { days?: number; range?: string } = {}) => {
    const p = typeof params === "number" ? { days: params } : params;
    return apiRequest<any>(`/analytics/trends${qs(p)}`);
  },
};