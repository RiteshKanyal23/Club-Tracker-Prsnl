import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { AnnouncementsRepository } from "./announcements.repository";

export const AnnouncementsService = {
  list: (q:any)=>AnnouncementsRepository.list(q),
  async getById(id:string){ const a=await AnnouncementsRepository.getById(id); if(!a) throw new AppError("Announcement not found",404); return a; },
  async create(payload:any, userId?:string){ const a = await AnnouncementsRepository.create(payload,userId); await auditLog({ actorId: userId, action: "announcement.create", entityType: "Announcement", entityId: a.id, after: { title: a.title } }); return a; },
  async update(id:string,payload:any, actorId?:string){ await this.getById(id); const a = await AnnouncementsRepository.update(id,payload); await auditLog({ actorId, action: "announcement.update", entityType: "Announcement", entityId: id, after: { title: a.title } }); return a; },
  async remove(id:string, actorId?:string){ const before = await this.getById(id); const a = await AnnouncementsRepository.remove(id); await auditLog({ actorId, action: "announcement.delete", entityType: "Announcement", entityId: id, before: { title: before.title } }); return a; },
  markRead: (id:string,userId:string)=>AnnouncementsRepository.markRead(id,userId),
};
