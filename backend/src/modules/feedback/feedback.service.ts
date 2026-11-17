import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { FeedbackRepository } from "./feedback.repository";

export const FeedbackService = {
  list: (query: any, user: any) => FeedbackRepository.list(query, user),
  async getById(id: string) { const f = await FeedbackRepository.getById(id); if (!f) throw new AppError("Feedback not found", 404); return f; },
  async create(payload: any, userId: string) { const f = await FeedbackRepository.create({ ...payload, fromUserId: userId, status: "OPEN" }); await auditLog({ actorId: userId, action: "feedback.create", entityType: "Feedback", entityId: f.id, after: { toUserId: f.toUserId, status: f.status } }); return f; },
  async update(id: string, payload: any, user: any) {
    const f = await this.getById(id);
    const privileged = ["ADMIN", "COORDINATOR", "PROJECT_MANAGER", "TEAM_LEADER"].includes(user?.role);
    if (!privileged && f.fromUserId !== user?.id) throw new AppError("Not allowed", 403);
    const data: any = { ...payload };
    if ((payload.status || payload.response) && privileged) data.reviewedBy = user.id;
    const updated = await FeedbackRepository.update(id, data);
    await auditLog({ actorId: user?.id, action: "feedback.update", entityType: "Feedback", entityId: id, before: { status: f.status }, after: { status: updated.status } });
    return updated;
  },
  async remove(id: string, user: any) {
    const f = await this.getById(id);
    const privileged = ["ADMIN", "COORDINATOR"].includes(user?.role);
    if (!privileged && f.fromUserId !== user?.id) throw new AppError("Not allowed", 403);
    const deleted = await FeedbackRepository.remove(id);
    await auditLog({ actorId: user?.id, action: "feedback.delete", entityType: "Feedback", entityId: id });
    return deleted;
  },
};
