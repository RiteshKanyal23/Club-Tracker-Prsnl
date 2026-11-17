import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { MeetingMinutesRepository } from "./meeting-minutes.repository";
export const MeetingMinutesService = {
  list: (q:any)=>MeetingMinutesRepository.list(q),
  async getById(id:string){ const m=await MeetingMinutesRepository.getById(id); if(!m) throw new AppError("Minutes not found",404); return m; },
  async upsert(payload:any, userId?:string){
    const m = await MeetingMinutesRepository.upsert(payload.meetingId, payload.content, userId);
    await auditLog({ actorId: userId, action: "meeting_minutes.upsert", entityType: "MeetingMinutes", entityId: m.id, after: { meetingId: payload.meetingId } });
    return m;
  },
  async remove(id:string, actorId?:string){
    const before = await this.getById(id);
    const m = await MeetingMinutesRepository.remove(id);
    await auditLog({ actorId, action: "meeting_minutes.delete", entityType: "MeetingMinutes", entityId: id, before: { meetingId: (before as any).meetingId } });
    return m;
  },
};
