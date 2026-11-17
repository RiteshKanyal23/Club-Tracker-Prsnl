import { prisma } from "../../config/database";

export const TeamsRepository = {
  list(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const where: any = { deletedAt: null };
    if (query.search) where.name = { contains: String(query.search), mode: "insensitive" };
    return Promise.all([
      prisma.team.findMany({ where, include: { members: { include: { member: { include: { user: true } } } }, projects: { include: { project: true } } }, orderBy: { createdAt: "desc" }, skip: (page-1)*limit, take: limit }),
      prisma.team.count({ where }),
    ]).then(([items, total]) => ({ items, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } }));
  },
  getById(id: string) {
    return prisma.team.findFirst({ where: { id, deletedAt: null }, include: { members: { include: { member: { include: { user: true } } } }, projects: { include: { project: true } } } });
  },
  create(data: any) { return prisma.team.create({ data }); },
  update(id: string, data: any) { return prisma.team.update({ where: { id }, data }); },
  softDelete(id: string) { return prisma.team.update({ where: { id }, data: { deletedAt: new Date() } }); },
};
