import { apiRequest } from "../../services/apiClient";

export const teamsApi = {
  list: (params?: Record<string, any>) => {
    const qs = params ? "?" + new URLSearchParams(Object.entries(params).filter(([_,v])=>v!=null && v!=="").map(([k,v])=>[k,String(v)])).toString() : "";
    return apiRequest<any>(`/teams${qs}`);
  },
  create: (data: any) => apiRequest<any>("/teams", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/teams/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => apiRequest<any>(`/teams/${id}`, { method: "DELETE" }),
  addMember: (data: { teamId: string; memberId: string }) => apiRequest<any>("/team-members", { method: "POST", body: JSON.stringify(data) }),
};
