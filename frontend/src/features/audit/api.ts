import { apiRequest } from "../../services/apiClient";
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";
const qs = (p?: any) => p ? "?" + new URLSearchParams(Object.entries(p).filter(([_, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)])).toString() : "";
export const auditApi = {
  list: (p?: any) => apiRequest<any>(`/audit${qs(p)}`),
  get: (id: string) => apiRequest<any>(`/audit/${id}`),
  exportUrl: (p?: any) => `${BASE}/audit/export/csv${qs(p)}`,
};