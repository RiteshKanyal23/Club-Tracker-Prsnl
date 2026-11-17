import { prisma } from "../../config/database";

export const AnnouncementsRepository = {
  list(query:any){
    const where:any = {};
    if (query.pinned === "true") where.pinned = true;
    return prisma.announcement.findMany({ where, include: { receipts: true }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }] });
  },
  getById(id:string){ return prisma.announcement.findUnique({ where: { id }, include: { receipts: true } }); },
  create(data:any, userId?:string){ return prisma.announcement.create({ data: { ...data, createdBy: userId, targetRoles: data.targetRoles||[], targetTeams: data.targetTeams||[] } }); },
  update(id:string,data:any){ return prisma.announcement.update({ where: { id }, data }); },
  remove(id:string){ return prisma.announcement.delete({ where: { id } }); },
  markRead(announcementId:string, userId:string){ return prisma.announcementReceipt.upsert({ where: { announcementId_userId: { announcementId, userId } }, update: { readAt: new Date() }, create: { announcementId, userId } }); },
};
