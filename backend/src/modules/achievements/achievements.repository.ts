import { prisma } from "../../config/database";

export const AchievementsRepository = {
  list() { return prisma.achievement.findMany({ include: { _count: { select: { awards: true } } }, orderBy: { createdAt: "desc" } }); },
  getById(id: string) { return prisma.achievement.findUnique({ where: { id }, include: { awards: { include: { member: { include: { user: { select: { id: true, name: true, email: true } } } } } } } }); },
  create(data: any) { return prisma.achievement.create({ data }); },
  update(id: string, data: any) { return prisma.achievement.update({ where: { id }, data }); },
  remove(id: string) { return prisma.achievement.delete({ where: { id } }); },
  listAwards(query: any) {
    const where: any = {};
    if (query.memberId) where.memberId = String(query.memberId);
    if (query.achievementId) where.achievementId = String(query.achievementId);
    return prisma.memberAchievement.findMany({ where, include: { achievement: true, member: { include: { user: { select: { id: true, name: true, email: true } } } } }, orderBy: { awardedAt: "desc" } });
  },
  award(data: { memberId: string; achievementId: string; awardedBy?: string; note?: string }) {
    return prisma.memberAchievement.upsert({
      where: { memberId_achievementId: { memberId: data.memberId, achievementId: data.achievementId } },
      update: { awardedBy: data.awardedBy, note: data.note, awardedAt: new Date() },
      create: data,
      include: { achievement: true },
    });
  },
};
