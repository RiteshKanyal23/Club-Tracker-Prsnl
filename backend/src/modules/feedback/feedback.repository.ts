import { prisma } from "../../config/database";

export const FeedbackRepository = {
  list(query: any, user: any) {
    const where: any = {};
    if (query.projectId) where.projectId = String(query.projectId);
    if (query.toUserId) where.toUserId = String(query.toUserId);
    if (query.status) where.status = String(query.status);
    // members see their own given/received by default unless privileged
    const privileged = ["ADMIN", "COORDINATOR", "PROJECT_MANAGER", "TEAM_LEADER"].includes(user?.role);
    if (!privileged && user?.id) where.OR = [{ fromUserId: user.id }, { toUserId: user.id }];
    return prisma.feedback.findMany({
      where,
      include: {
        fromUser: { select: { id: true, name: true, email: true, role: true } },
        toUser: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },
  getById(id: string) {
    return prisma.feedback.findUnique({ where: { id }, include: { fromUser: { select: { id: true, name: true, email: true } }, toUser: { select: { id: true, name: true, email: true } } } });
  },
  create(data: any) { return prisma.feedback.create({ data, include: { fromUser: { select: { id: true, name: true, email: true } }, toUser: { select: { id: true, name: true, email: true } } } }); },
  update(id: string, data: any) { return prisma.feedback.update({ where: { id }, data, include: { fromUser: { select: { id: true, name: true, email: true } }, toUser: { select: { id: true, name: true, email: true } } } }); },
  remove(id: string) { return prisma.feedback.delete({ where: { id } }); },
};
