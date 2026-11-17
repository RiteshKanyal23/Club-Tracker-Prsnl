import { prisma } from "../../config/database";

export const ProgressRepository = {
  async projectProgress(projectId: string) {
    const tasks = await prisma.task.findMany({ where: { projectId, deletedAt: null }, select: { id: true, status: true, dueDate: true, createdAt: true } });
    const milestones = await prisma.milestone.findMany({ where: { projectId, deletedAt: null }, include: { tasks: { where: { deletedAt: null }, select: { status: true } } } });
    return { tasks, milestones };
  },
};
