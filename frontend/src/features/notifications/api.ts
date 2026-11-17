import { apiRequest } from "../../services/apiClient";
export const notificationsApi = {
  list: (unreadOnly = false) => apiRequest<any>(`/notifications${unreadOnly ? "?unread=true" : ""}`),
  markRead: (id: string) => apiRequest<any>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => apiRequest<any>("/notifications/read-all", { method: "POST" }),
  getPrefs: () => apiRequest<any>("/notifications/preferences"),
  updatePrefs: (data: any) => apiRequest<any>("/notifications/preferences", { method: "PUT", body: JSON.stringify(data) }),
};