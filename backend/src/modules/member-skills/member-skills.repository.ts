import { prisma } from "../../config/database";

export const MemberSkillsRepository = {
  list(query: any) {
    const where: any = {};
    if (query.memberId) where.memberId = String(query.memberId);
    if (query.name) where.name = { contains: String(query.name), mode: "insensitive" };
    return prisma.memberSkill.findMany({ where, include: { member: { include: { user: { select: { id: true, name: true, email: true } } } } }, orderBy: { name: "asc" } });
  },
  getById(id: string) { return prisma.memberSkill.findUnique({ where: { id }, include: { member: true } }); },
  create(data: any) { return prisma.memberSkill.create({ data }); },
  update(id: string, data: any) { return prisma.memberSkill.update({ where: { id }, data }); },
  remove(id: string) { return prisma.memberSkill.delete({ where: { id } }); },
};
