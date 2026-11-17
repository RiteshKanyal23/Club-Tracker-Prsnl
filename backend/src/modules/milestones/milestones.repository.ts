import { prisma } from "../../config/database";

export const MilestonesRepository = {
  list(query: any) {
    const where: any = { deletedAt: null };
    if (query.projectId) where.projectId = String(query.projectId);
    return prisma.milestone.findMany({ where, include: { tasks: { where: { deletedAt: null }, select: { id: true, status: true } } }, orderBy: { dueDate: "asc" } });
  },
  getById(id: string) { return prisma.milestone.findFirst({ where: { id, deletedAt: null }, include: { tasks: { where: { deletedAt: null } } } }); },
  create(data: any) { return prisma.milestone.create({ data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : null } }); },
  update(id: string, data: any) { return prisma.milestone.update({ where: { id }, data: { ...data, ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}) } }); },
  softDelete(id: string) { return prisma.milestone.update({ where: { id }, data: { deletedAt: new Date() } }); },
};
