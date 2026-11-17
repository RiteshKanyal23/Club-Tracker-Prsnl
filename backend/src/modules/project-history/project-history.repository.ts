import { prisma } from "../../config/database";

export const ProjectHistoryRepository = {
  list(projectId?: string) {
    return prisma.projectHistory.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },
  getById(id: string) {
    return prisma.projectHistory.findUnique({ where: { id } });
  },
};
