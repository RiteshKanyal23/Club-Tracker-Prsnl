import { prisma } from "../../config/database";

export const TaskCommentsRepository = {
  list(query: any) {
    const where: any = {};
    if (query.taskId) where.taskId = String(query.taskId);
    return prisma.taskComment.findMany({ where, orderBy: { createdAt: "desc" }, include: { task: { select: { id: true, projectId: true, title: true } } } });
  },
  getById(id: string) { return prisma.taskComment.findUnique({ where: { id }, include: { task: { select: { id: true, projectId: true } } } }); },
  create(data: { taskId: string; authorId: string; content: string; mentions?: string[] }) { return prisma.taskComment.create({ data, include: { task: { select: { id: true, projectId: true } } } }); },
  update(id: string, data: any) { return prisma.taskComment.update({ where: { id }, data, include: { task: { select: { id: true, projectId: true } } } }); },
  remove(id: string) { return prisma.taskComment.delete({ where: { id } }); },
};
