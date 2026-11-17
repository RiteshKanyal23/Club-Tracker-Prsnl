import { apiRequest } from "../../services/apiClient";
export const meetingsApi = {
  list: ()=>apiRequest<any>("/meetings"),
  create: (data:any)=>apiRequest<any>("/meetings",{method:"POST",body:JSON.stringify(data)}),
  minutes: (meetingId:string)=>apiRequest<any>(`/meeting-minutes?meetingId=${meetingId}`),
  saveMinutes: (data:any)=>apiRequest<any>("/meeting-minutes",{method:"POST",body:JSON.stringify(data)}),
  actionItems: (meetingId:string)=>apiRequest<any>(`/action-items?meetingId=${meetingId}`),
  createAction: (data:any)=>apiRequest<any>("/action-items",{method:"POST",body:JSON.stringify(data)}),
  convertAction: (id:string, projectId:string)=>apiRequest<any>(`/action-items/${id}/convert-to-task`,{method:"POST",body:JSON.stringify({projectId})}),
};
