import { apiRequest } from "../../services/apiClient";

export const tasksApi = {
  list: (params?: Record<string, any>) => {
    const qs = params ? "?" + new URLSearchParams(Object.entries(params).filter(([_,v])=>v!=null && v!=="").map(([k,v])=>[k,String(v)])).toString() : "";
    return apiRequest<any>(`/tasks${qs}`);
  },
  create: (data: any) => apiRequest<any>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  move: (id: string, data: any) => apiRequest<any>(`/tasks/${id}/move`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => apiRequest<any>(`/tasks/${id}`, { method: "DELETE" }),
  comments: (taskId: string) => apiRequest<any>(`/task-comments?taskId=${taskId}`),
  addComment: (data: any) => apiRequest<any>("/task-comments", { method: "POST", body: JSON.stringify(data) }),
};

export const milestonesApi = {
  list: (projectId: string) => apiRequest<any>(`/milestones?projectId=${projectId}`),
  create: (data: any) => apiRequest<any>("/milestones", { method: "POST", body: JSON.stringify(data) }),
};

export const progressApi = {
  project: (projectId: string) => apiRequest<any>(`/progress/${projectId}`),
};
