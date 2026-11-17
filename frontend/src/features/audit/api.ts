import { apiRequest } from "../../services/apiClient";
import { API_BASE_URL } from "../../config/api";
const qs = (p?: any) => p ? "?" + new URLSearchParams(Object.entries(p).filter(([_, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)])).toString() : "";
export const auditApi = {
  list: (p?: any) => apiRequest<any>(`/audit${qs(p)}`),
  get: (id: string) => apiRequest<any>(`/audit/${id}`),
  exportUrl: (p?: any) => `${API_BASE_URL}/audit/export/csv${qs(p)}`,
};