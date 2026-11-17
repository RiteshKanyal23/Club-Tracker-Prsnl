import { apiRequest } from "../../services/apiClient";
const qs = (p?:any)=> p ? "?"+new URLSearchParams(Object.entries(p).filter(([_,v])=>v!=null&&v!=="").map(([k,v])=>[k,String(v)])).toString() : "";
export const leaveApi = {
  list: (p?:any)=>apiRequest<any>(`/leave${qs(p)}`),
  apply: (data:any)=>apiRequest<any>("/leave",{method:"POST",body:JSON.stringify(data)}),
  review: (id:string,data:any)=>apiRequest<any>(`/leave/${id}/review`,{method:"POST",body:JSON.stringify(data)}),
  calendar: (p?:any)=>apiRequest<any>(`/leave/calendar${qs(p)}`),
  balance: (memberId:string)=>apiRequest<any>(`/leave/balance?memberId=${memberId}`),
};
