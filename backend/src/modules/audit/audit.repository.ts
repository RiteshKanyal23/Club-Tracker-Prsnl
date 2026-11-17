import { prisma } from "../../config/database";

export const AuditRepository = {
  list(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));
    const where: any = {};
    if (query.entityType) where.entityType = String(query.entityType);
    if (query.entityId) where.entityId = String(query.entityId);
    if (query.actorId) where.actorId = String(query.actorId);
    if (query.action) where.action = { contains: String(query.action), mode: "insensitive" };
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(String(query.from));
      if (query.to) where.createdAt.lte = new Date(String(query.to));
    }
    return Promise.all([
      prisma.auditLog.findMany({ where, include: { actor: { select: { id: true, name: true, email: true, role: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.auditLog.count({ where }),
    ]).then(([items, total]) => ({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }));
  },
  getById(id: string) { return prisma.auditLog.findUnique({ where: { id }, include: { actor: { select: { id: true, name: true, email: true, role: true } } } }); },
  create(data: any) { return prisma.auditLog.create({ data }); },
};
