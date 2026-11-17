import { AppError } from "../../utils/AppError";
import { TaskCommentsRepository } from "./task-comments.repository";
import { emitToProject } from "../../sockets";
import { auditLog } from "../../services/audit.service";

export const TaskCommentsService = {
  list: (query: any) => TaskCommentsRepository.list(query),
  async getById(id: string) { const c = await TaskCommentsRepository.getById(id); if (!c) throw new AppError("Comment not found", 404); return c; },
  async create(payload: { taskId: string; content: string; mentions?: string[] }, authorId: string) {
    const comment = await TaskCommentsRepository.create({ ...payload, authorId });
    emitToProject(comment.task.projectId, "task:commented", comment);
    await auditLog({ actorId: authorId, action: "task_comment.create", entityType: "TaskComment", entityId: comment.id, after: { taskId: comment.taskId } });
    return comment;
  },
  async update(id: string, payload: any, actor?: { id: string; role?: string }) {
    const existing = await this.getById(id);
    const privileged = ["ADMIN", "COORDINATOR", "PROJECT_MANAGER", "TEAM_LEADER"].includes(actor?.role || "");
    if (!privileged && existing.authorId !== actor?.id) throw new AppError("Not allowed", 403);
    const c = await TaskCommentsRepository.update(id, payload);
    await auditLog({ actorId: actor?.id, action: "task_comment.update", entityType: "TaskComment", entityId: id });
    return c;
  },
  async remove(id: string, actor?: { id: string; role?: string }) {
    const c = await this.getById(id);
    const privileged = ["ADMIN", "COORDINATOR", "PROJECT_MANAGER", "TEAM_LEADER"].includes(actor?.role || "");
    if (!privileged && c.authorId !== actor?.id) throw new AppError("Not allowed", 403);
    await TaskCommentsRepository.remove(id);
    emitToProject(c.task.projectId, "task:commentDeleted", { id, taskId: c.taskId });
    await auditLog({ actorId: actor?.id, action: "task_comment.delete", entityType: "TaskComment", entityId: id, before: { taskId: c.taskId } });
    return { id };
  },
};
