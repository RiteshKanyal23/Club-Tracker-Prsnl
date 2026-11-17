import { apiRequest } from "../../services/apiClient";
import { API_BASE_URL } from "../../config/api";
const qs = (p?: any) => p ? "?" + new URLSearchParams(Object.entries(p).filter(([_, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)])).toString() : "";

const formRequest = (path: string, form: FormData) => apiRequest<any>(path, { method: "POST", body: form });

export const attendanceApi = {
  list: (p?: any) => apiRequest<any>(`/attendance${qs(p)}`),
  stats: (p?: any) => apiRequest<any>(`/attendance/stats${qs(p)}`),
  create: (data: any) => apiRequest<any>("/attendance", { method: "POST", body: JSON.stringify(data) }),
  checkIn: (data: any) => apiRequest<any>("/attendance/check-in", { method: "POST", body: JSON.stringify(data) }),
  checkOut: (id: string) => apiRequest<any>(`/attendance/${id}/check-out`, { method: "POST", body: "{}" }),
  report: (p?: any) => apiRequest<any>(`/attendance/report${qs(p)}`),
  capture: (form: FormData) => formRequest("/attendance/capture", form),
  exportCsvUrl: (p?: any) => `${API_BASE_URL}/attendance/export/csv${qs(p)}`,
  photoUrl: (id: string) => `${API_BASE_URL}/attendance/${id}/photo`,
};

