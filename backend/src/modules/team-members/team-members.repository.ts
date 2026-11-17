import { prisma } from "../../config/database";

export const TeamMembersRepository = {
  list(query: any) {
    const where: any = {};
    if (query.teamId) where.teamId = String(query.teamId);
    if (query.memberId) where.memberId = String(query.memberId);
    return prisma.teamMember.findMany({ where, include: { team: true, member: { include: { user: true } } }, orderBy: { joinedAt: "desc" } });
  },
  getById(id: string) { return prisma.teamMember.findUnique({ where: { id }, include: { team: true, member: { include: { user: true } } } }); },
  add(teamId: string, memberId: string) { return prisma.teamMember.create({ data: { teamId, memberId }, include: { team: true, member: { include: { user: true } } } }); },
  remove(id: string) { return prisma.teamMember.delete({ where: { id } }); },
  removeByTeamAndMember(teamId: string, memberId: string) { return prisma.teamMember.deleteMany({ where: { teamId, memberId } }); },
};
