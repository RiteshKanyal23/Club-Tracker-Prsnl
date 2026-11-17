import { apiRequest } from "../../services/apiClient";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";
const qs = (p?: any) => p ? "?" + new URLSearchParams(Object.entries(p).filter(([_, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)])).toString() : "";

async function formRequest(path: string, form: FormData) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "POST", body: form, credentials: "include" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json;
}

export const attendanceApi = {
  list: (p?: any) => apiRequest<any>(`/attendance${qs(p)}`),
  stats: (p?: any) => apiRequest<any>(`/attendance/stats${qs(p)}`),
  checkIn: (data: any) => apiRequest<any>("/attendance/check-in", { method: "POST", body: JSON.stringify(data) }),
  checkOut: (id: string) => apiRequest<any>(`/attendance/${id}/check-out`, { method: "POST", body: "{}" }),
  report: (p?: any) => apiRequest<any>(`/attendance/report${qs(p)}`),
  capture: (form: FormData) => formRequest("/attendance/capture", form),
  exportCsvUrl: (p?: any) => `${BASE_URL}/attendance/export/csv${qs(p)}`,
  photoUrl: (id: string) => `${BASE_URL}/attendance/${id}/photo`,
};

