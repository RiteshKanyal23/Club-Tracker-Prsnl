import { apiRequest } from "../../services/apiClient";
const qs = (p?: any) => p ? "?" + new URLSearchParams(Object.entries(p).filter(([_, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)])).toString() : "";
export const achievementsApi = {
  list: () => apiRequest<any>("/achievements"),
  awards: (p?: any) => apiRequest<any>(`/achievements/awards${qs(p)}`),
  create: (data: any) => apiRequest<any>("/achievements", { method: "POST", body: JSON.stringify(data) }),
  award: (data: any) => apiRequest<any>("/achievements/award", { method: "POST", body: JSON.stringify(data) }),
  evaluate: (memberId: string) => apiRequest<any>("/achievements/evaluate", { method: "POST", body: JSON.stringify({ memberId }) }),
};