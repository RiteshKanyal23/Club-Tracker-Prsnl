import { apiRequest } from "../../services/apiClient";

const qs = (p?: any) =>
  p
    ? "?" +
      new URLSearchParams(
        Object.entries(p)
          .filter(([_, v]) => v != null && v !== "")
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";

export const organizationApi = {
  hierarchy: () => apiRequest<any>("/organization/hierarchy"),
  validation: () => apiRequest<any>("/organization/validation"),
  roster: () => apiRequest<any>("/organization/roster"),
  members: (p?: any) => apiRequest<any>(`/organization/members${qs(p)}`),
  me: () => apiRequest<any>("/organization/me"),
  projects: () => apiRequest<any>("/organization/projects"),
  designations: () => apiRequest<any>("/organization/designations"),

  registerMember: (data: any) =>
    apiRequest<any>("/organization/members", { method: "POST", body: JSON.stringify(data) }),
  updateMember: (memberId: string, data: any) =>
    apiRequest<any>(`/organization/members/${memberId}`, { method: "PUT", body: JSON.stringify(data) }),
  setMemberStatus: (memberId: string, accountStatus: "ACTIVE" | "INACTIVE") =>
    apiRequest<any>(`/organization/members/${memberId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ accountStatus }),
    }),
  removeFromTeam: (memberId: string) =>
    apiRequest<any>(`/organization/members/${memberId}/team`, { method: "DELETE" }),

  createDesignation: (data: any) =>
    apiRequest<any>("/organization/designations", { method: "POST", body: JSON.stringify(data) }),
  updateDesignation: (id: string, data: any) =>
    apiRequest<any>(`/organization/designations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  removeDesignation: (id: string) =>
    apiRequest<any>(`/organization/designations/${id}`, { method: "DELETE" }),

  updateProject: (projectId: string, data: any) =>
    apiRequest<any>(`/organization/projects/${projectId}`, { method: "PATCH", body: JSON.stringify(data) }),
  updateTeam: (teamId: string, data: any) =>
    apiRequest<any>(`/organization/teams/${teamId}`, { method: "PATCH", body: JSON.stringify(data) }),
};
