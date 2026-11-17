import { prisma } from "../../config/database";

export const MembersRepository = {
  async list(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const where: any = {};
    if (query.skill) {
      where.skills = { some: { name: { contains: String(query.skill), mode: "insensitive" }, ...(query.minProficiency ? { proficiency: { gte: Number(query.minProficiency) } } : {}) } };
    }
    if (query.search) {
      where.user = { name: { contains: String(query.search), mode: "insensitive" } };
    }
    const [items, total] = await Promise.all([
      prisma.member.findMany({ where, include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } }, skills: true, teamLinks: { include: { team: true } } }, skip: (page-1)*limit, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.member.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  },
  getById(id: string) { return prisma.member.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } }, skills: true, teamLinks: { include: { team: true } } } }); },
  create(data: any) { return prisma.member.create({ data }); },
  update(id: string, data: any) { return prisma.member.update({ where: { id }, data }); },
  remove(id: string) { return prisma.member.delete({ where: { id } }); },
};
