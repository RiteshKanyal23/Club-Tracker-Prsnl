import { AppError } from "../../utils/AppError";
import { NotificationsRepository } from "./notifications.repository";
import { emitToUser } from "../../sockets";
import { emailService } from "../../services/email.service";
import { prisma } from "../../config/database";
import { auditLog } from "../../services/audit.service";

export const NotificationsService = {
  list: (userId:string, q:any)=>NotificationsRepository.list(userId,q),
  async getById(id:string,userId:string){ const n=await NotificationsRepository.getById(id); if(!n || n.userId!==userId) throw new AppError("Notification not found",404); return n; },
  async create(payload:any, actorId?: string){
    const n = await NotificationsRepository.create(payload);
    emitToUser(n.userId, "notification:new", n);
    // best-effort email if enabled
    const prefs = await NotificationsRepository.getPrefs(n.userId);
    if (prefs.email) { const user = await prisma.user.findUnique({ where: { id: n.userId } }); if (user) await emailService.send(user.email, n.title, n.body || n.title).catch(()=>{}); }
    await auditLog({ actorId, action: "notification.create", entityType: "Notification", entityId: n.id, after: { userId: n.userId, type: n.type } });
    return n;
  },
  markRead: (id:string,userId:string)=>NotificationsRepository.markRead(id,userId),
  markAllRead: (userId:string)=>NotificationsRepository.markAllRead(userId),
  getPrefs: (userId:string)=>NotificationsRepository.getPrefs(userId),
  async updatePrefs(userId:string,data:any){
    const prefs = await NotificationsRepository.updatePrefs(userId,data);
    await auditLog({ actorId: userId, action: "notification.prefs_update", entityType: "NotificationPreference", entityId: (prefs as any).id || userId });
    return prefs;
  },
};
