import { prisma } from "../../config/database";

export const CommunicationRepository = {
  listChannels(userId: string) {
    return prisma.channel.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  },
  async getChannel(id: string) {
    return prisma.channel.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
  },
  createChannel(data: any, userId: string) {
    return prisma.channel.create({
      data: {
        name: data.name,
        type: data.type,
        teamId: data.teamId || null,
        projectId: data.projectId || null,
        createdBy: userId,
        members: { create: { userId } },
      },
      include: { members: true },
    });
  },
  async joinChannel(channelId: string, userId: string) {
    return prisma.channelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      update: {},
      create: { channelId, userId },
    });
  },
  async markRead(channelId: string, userId: string) {
    return prisma.channelMember.updateMany({ where: { channelId, userId }, data: { lastReadAt: new Date() } });
  },
  async listMessages(channelId: string, take = 100) {
    return prisma.message.findMany({
      where: { channelId },
      include: { sender: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
      take,
    });
  },
  createMessage(data: { channelId: string; senderId: string; content: string; fileName?: string | null; filePath?: string | null; fileMime?: string | null }) {
    return prisma.message.create({
      data,
      include: { sender: { select: { id: true, name: true, email: true } } },
    });
  },
  getMembership(channelId: string, userId: string) {
    return prisma.channelMember.findUnique({ where: { channelId_userId: { channelId, userId } } });
  },
  async unreadCount(channelId: string, userId: string) {
    const m = await prisma.channelMember.findUnique({ where: { channelId_userId: { channelId, userId } } });
    if (!m) return 0;
    return prisma.message.count({ where: { channelId, createdAt: { gt: m.lastReadAt || new Date(0) }, senderId: { not: userId } } });
  },
  async channelsWithUnread(userId: string) {
    const channels = await this.listChannels(userId);
    const enriched = await Promise.all(channels.map(async (c) => ({ ...c, unread: await this.unreadCount(c.id, userId) })));
    return enriched;
  },
};
