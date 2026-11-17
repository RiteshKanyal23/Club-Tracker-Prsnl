import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { MeetingsRepository } from "./meetings.repository";

export const MeetingsService = {
  list: (q:any)=>MeetingsRepository.list(q),
  async getById(id:string){ const m=await MeetingsRepository.getById(id); if(!m) throw new AppError("Meeting not found",404); return m; },
  async create(payload:any, userId?:string){
    const m = await MeetingsRepository.create(payload,userId);
    await auditLog({ actorId: userId, action: "meeting.create", entityType: "Meeting", entityId: m.id, after: { title: m.title } });
    return m;
  },
  async update(id:string,payload:any, actorId?:string){
    const before = await this.getById(id);
    const m = await MeetingsRepository.update(id,payload);
    await auditLog({ actorId, action: "meeting.update", entityType: "Meeting", entityId: id, before: { title: before.title }, after: { title: m.title } });
    return m;
  },
  async remove(id:string, actorId?:string){
    const before = await this.getById(id);
    const m = await MeetingsRepository.remove(id);
    await auditLog({ actorId, action: "meeting.delete", entityType: "Meeting", entityId: id, before: { title: before.title } });
    return m;
  },
};
