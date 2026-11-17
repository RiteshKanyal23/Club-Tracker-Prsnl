import { prisma } from "../../config/database";
export const NotificationsRepository = {
  list(userId: string, query:any){
    const where:any = { userId };
    if (query.unread === "true") where.readAt = null;
    return prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: Math.min(200, Number(query.limit)||50) });
  },
  getById(id:string){ return prisma.notification.findUnique({ where: { id } }); },
  create(data:any){ return prisma.notification.create({ data: { ...data, type: data.type || "INFO" } }); },
  markRead(id:string, userId:string){ return prisma.notification.updateMany({ where: { id, userId }, data: { readAt: new Date() } }); },
  markAllRead(userId:string){ return prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } }); },
  getPrefs(userId:string){ return prisma.notificationPreference.upsert({ where: { userId }, update: {}, create: { userId } }); },
  updatePrefs(userId:string, data:any){ return prisma.notificationPreference.upsert({ where: { userId }, update: data, create: { userId, ...data } }); },
};
