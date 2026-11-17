import { prisma } from "../../config/database";

export const LeaveRepository = {
  list(query: any) {
    const where: any = {};
    if (query.memberId) where.memberId = String(query.memberId);
    if (query.status) where.status = String(query.status);
    return prisma.leaveRequest.findMany({ where, include: { member: { include: { user: { select: { id:true,name:true,email:true } } } } }, orderBy: { createdAt: "desc" } });
  },
  getById(id: string) { return prisma.leaveRequest.findUnique({ where: { id }, include: { member: { include: { user: true } } } }); },
  create(data: any) { return prisma.leaveRequest.create({ data: { ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate) } }); },
  update(id: string, data: any) { return prisma.leaveRequest.update({ where: { id }, data }); },
  remove(id: string) { return prisma.leaveRequest.delete({ where: { id } }); },
  getBalance(memberId: string) { return prisma.leaveBalance.findUnique({ where: { memberId } }); },
  upsertBalance(memberId: string, year: number, total: number, used?: number) {
    return prisma.leaveBalance.upsert({ where: { memberId }, update: { year, total, ...(used !== undefined ? { used } : {}) }, create: { memberId, year, total, used: used ?? 0 } });
  },
  incrementUsed(memberId: string, days: number) {
    return prisma.leaveBalance.update({ where: { memberId }, data: { used: { increment: days } } }).catch(async () => {
      const year = new Date().getFullYear();
      return prisma.leaveBalance.create({ data: { memberId, year, total: 20, used: days } });
    });
  },
};
