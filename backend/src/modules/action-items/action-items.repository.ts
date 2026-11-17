import { prisma } from "../../config/database";
export const ActionItemsRepository = {
  list(query:any){ return prisma.actionItem.findMany({ where: query.meetingId ? { meetingId: String(query.meetingId) } : undefined, include: { meeting: true }, orderBy: { createdAt: "desc" } }); },
  getById(id:string){ return prisma.actionItem.findUnique({ where: { id }, include: { meeting: true } }); },
  create(data:any){ return prisma.actionItem.create({ data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : null } }); },
  update(id:string,data:any){ return prisma.actionItem.update({ where: { id }, data: { ...data, ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}) } }); },
  remove(id:string){ return prisma.actionItem.delete({ where: { id } }); },
};
