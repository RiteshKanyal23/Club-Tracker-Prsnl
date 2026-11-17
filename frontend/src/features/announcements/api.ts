import { apiRequest } from "../../services/apiClient";
export const announcementsApi = {
  list: () => apiRequest<any>("/announcements"),
  get: (id: string) => apiRequest<any>(`/announcements/${id}`),
  create: (data: any) => apiRequest<any>("/announcements", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/announcements/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiRequest<any>(`/announcements/${id}`, { method: "DELETE" }),
  markRead: (id: string) => apiRequest<any>(`/announcements/${id}/read`, { method: "POST" }),
};