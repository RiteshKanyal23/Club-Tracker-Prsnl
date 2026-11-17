import { AppError } from "../../utils/AppError";
import { TasksRepository } from "./tasks.repository";
import { emitToProject } from "../../sockets";
import { auditLog } from "../../services/audit.service";

export const TasksService = {
  list: (query: any) => TasksRepository.list(query),
  async getById(id: string) { const t = await TasksRepository.getById(id); if (!t) throw new AppError("Task not found", 404); return t; },
  async create(payload: any, actorId?: string) {
    const task = await TasksRepository.create(payload);
    emitToProject(task.projectId, "task:created", task);
    await auditLog({ actorId, action: "task.create", entityType: "Task", entityId: task.id, after: { title: task.title, status: task.status, projectId: task.projectId } });
    return task;
  },
  async update(id: string, payload: any, actorId?: string) {
    const before = await this.getById(id);
    const task = await TasksRepository.update(id, payload);
    emitToProject(task.projectId, "task:updated", task);
    await auditLog({ actorId, action: "task.update", entityType: "Task", entityId: id, before: { status: before.status, title: before.title }, after: { status: task.status, title: task.title } });
    return task;
  },
  async remove(id: string, actorId?: string) {
    const existing = await this.getById(id);
    const task = await TasksRepository.softDelete(id);
    emitToProject(existing.projectId, "task:deleted", { id });
    await auditLog({ actorId, action: "task.delete", entityType: "Task", entityId: id, before: { title: existing.title, projectId: existing.projectId } });
    return task;
  },
  async move(id: string, payload: { status: any; order?: number }, actorId?: string) {
    return this.update(id, payload, actorId);
  },
};
