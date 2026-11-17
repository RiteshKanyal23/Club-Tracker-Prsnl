import { AppError } from "../../utils/AppError";
import { emitToChannel } from "../../sockets";
import { auditLog } from "../../services/audit.service";
import { CommunicationRepository } from "./communication.repository";

export const CommunicationService = {
  listChannels: (userId: string) => CommunicationRepository.channelsWithUnread(userId),
  async getChannel(id: string, userId: string) {
    const ch = await CommunicationRepository.getChannel(id);
    if (!ch) throw new AppError("Channel not found", 404);
    const member = ch.members.find((m) => m.userId === userId);
    if (!member) throw new AppError("Not a channel member", 403);
    return ch;
  },
  async createChannel(payload: any, userId: string) {
    const ch = await CommunicationRepository.createChannel(payload, userId);
    await auditLog({ actorId: userId, action: "communication.channel_create", entityType: "Channel", entityId: ch.id, after: { name: (ch as any).name, type: (ch as any).type } });
    return ch;
  },
  async join(channelId: string, userId: string) {
    const ch = await CommunicationRepository.getChannel(channelId);
    if (!ch) throw new AppError("Channel not found", 404);
    const m = await CommunicationRepository.joinChannel(channelId, userId);
    await auditLog({ actorId: userId, action: "communication.channel_join", entityType: "Channel", entityId: channelId, after: { userId } });
    return m;
  },
  async markRead(channelId: string, userId: string) {
    await this.getChannel(channelId, userId);
    await CommunicationRepository.markRead(channelId, userId);
    return { channelId, read: true };
  },
  async listMessages(channelId: string, userId: string) {
    await this.getChannel(channelId, userId);
    return CommunicationRepository.listMessages(channelId);
  },
  async sendMessage(channelId: string, userId: string, body: any, file?: Express.Multer.File) {
    await this.getChannel(channelId, userId);
    const content = (body?.content || "").trim();
    if (!content && !file) throw new AppError("Message content or file required", 400);
    const msg = await CommunicationRepository.createMessage({
      channelId,
      senderId: userId,
      content: content || (file ? `Shared file: ${file.originalname}` : ""),
      fileName: file?.originalname || null,
      filePath: file ? file.filename : null,
      fileMime: file?.mimetype || null,
    });
    await CommunicationRepository.markRead(channelId, userId);
    emitToChannel(channelId, "message:new", msg);
    await auditLog({ actorId: userId, action: "communication.message_send", entityType: "Message", entityId: msg.id, after: { channelId } });
    return msg;
  },
  // legacy compat
  list: (userId?: string) => (userId ? CommunicationRepository.channelsWithUnread(userId) : []),
  getById: (id: string) => CommunicationRepository.getChannel(id),
  create: (_p: unknown) => ({ message: "Use /communication/channels" }),
  update: (_id: string, _p: unknown) => ({ message: "Not supported" }),
  remove: (_id: string) => ({ message: "Not supported" }),
};
