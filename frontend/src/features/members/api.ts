import { apiRequest } from "../../services/apiClient";

export const membersApi = {
  list: (params?: Record<string, any>) => {
    const qs = params ? "?" + new URLSearchParams(Object.entries(params).filter(([_,v])=>v!=null && v!=="").map(([k,v])=>[k,String(v)])).toString() : "";
    return apiRequest<any>(`/members${qs}`);
  },
  create: (data: any) => apiRequest<any>("/members", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/members/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  skills: (memberId?: string) => apiRequest<any>(`/member-skills${memberId ? `?memberId=${memberId}` : ""}`),
  addSkill: (data: any) => apiRequest<any>("/member-skills", { method: "POST", body: JSON.stringify(data) }),
};
