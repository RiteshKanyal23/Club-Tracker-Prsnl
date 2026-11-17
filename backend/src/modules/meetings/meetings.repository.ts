import { prisma } from "../../config/database";

export const MeetingsRepository = {
  list(query: any) {
    const where: any = {};
    if (query.teamId) where.teamId = String(query.teamId);
    if (query.projectId) where.projectId = String(query.projectId);
    return prisma.meeting.findMany({ where, include: { minutes: true, actionItems: true }, orderBy: { scheduledAt: "desc" } });
  },
  getById(id: string) { return prisma.meeting.findUnique({ where: { id }, include: { minutes: true, actionItems: true } }); },
  create(data: any, userId?: string) { return prisma.meeting.create({ data: { ...data, scheduledAt: new Date(data.scheduledAt), createdBy: userId } }); },
  update(id: string, data: any) { return prisma.meeting.update({ where: { id }, data: { ...data, ...(data.scheduledAt ? { scheduledAt: new Date(data.scheduledAt) } : {}) } }); },
  remove(id: string) { return prisma.meeting.delete({ where: { id } }); },
};
