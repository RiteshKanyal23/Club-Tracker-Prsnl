import { prisma } from "../../config/database";

const include = {
  teams: { include: { team: true } },
  history: { orderBy: { createdAt: "desc" as const }, take: 20 },
};

export const ProjectsRepository = {
  async list(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const where: any = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.search) where.name = { contains: String(query.search), mode: "insensitive" };
    const [items, total] = await Promise.all([
      prisma.project.findMany({ where, include: { teams: { include: { team: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.project.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },
  getById(id: string) {
    return prisma.project.findFirst({ where: { id, deletedAt: null }, include });
  },
  create(data: any) {
    const { teamIds, deadline, ...rest } = data;
    return prisma.project.create({
      data: {
        ...rest,
        deadline: deadline ? new Date(deadline) : null,
        teams: teamIds?.length ? { create: teamIds.map((teamId: string) => ({ teamId })) } : undefined,
      },
      include,
    });
  },
  update(id: string, data: any) {
    const { teamIds, deadline, ...rest } = data;
    return prisma.project.update({
      where: { id },
      data: {
        ...rest,
        ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
        ...(teamIds ? { teams: { deleteMany: {}, create: teamIds.map((teamId: string) => ({ teamId })) } } : {}),
      },
      include,
    });
  },
  softDelete(id: string) {
    return prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
  },
  addHistory(projectId: string, actorId: string | undefined, action: string, details?: any) {
    return prisma.projectHistory.create({ data: { projectId, actorId, action, details } });
  },
};
