import { apiRequest } from "../../services/apiClient";
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

export const communicationApi = {
  channels: () => apiRequest<any>("/communication/channels"),
  createChannel: (data: any) => apiRequest<any>("/communication/channels", { method: "POST", body: JSON.stringify(data) }),
  channel: (id: string) => apiRequest<any>(`/communication/channels/${id}`),
  join: (id: string) => apiRequest<any>(`/communication/channels/${id}/join`, { method: "POST" }),
  markRead: (id: string) => apiRequest<any>(`/communication/channels/${id}/read`, { method: "POST" }),
  messages: (id: string) => apiRequest<any>(`/communication/channels/${id}/messages`),
  sendMessage: async (id: string, data: { content?: string; file?: File | null }) => {
    const form = new FormData();
    if (data.content) form.append("content", data.content);
    if (data.file) form.append("file", data.file);
    const res = await fetch(`${BASE}/communication/channels/${id}/messages`, { method: "POST", body: form, credentials: "include" });
    return res.json();
  },
};