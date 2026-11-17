import { AppError } from "../../utils/AppError";
import { prisma } from "../../config/database";
import { auditLog } from "../../services/audit.service";
import { ActionItemsRepository } from "./action-items.repository";

export const ActionItemsService = {
  list: (q:any)=>ActionItemsRepository.list(q),
  async getById(id:string){ const a=await ActionItemsRepository.getById(id); if(!a) throw new AppError("Action item not found",404); return a; },
  async create(payload:any, actorId?:string){
    const a = await ActionItemsRepository.create(payload);
    await auditLog({ actorId, action: "action_item.create", entityType: "MeetingActionItem", entityId: a.id, after: { title: a.title, meetingId: a.meetingId } });
    return a;
  },
  async update(id:string,payload:any, actorId?:string){
    const before = await this.getById(id);
    const a = await ActionItemsRepository.update(id,payload);
    await auditLog({ actorId, action: "action_item.update", entityType: "MeetingActionItem", entityId: id, before: { status: before.status }, after: { status: a.status } });
    return a;
  },
  async remove(id:string, actorId?:string){
    const before = await this.getById(id);
    const a = await ActionItemsRepository.remove(id);
    await auditLog({ actorId, action: "action_item.delete", entityType: "MeetingActionItem", entityId: id, before: { title: before.title } });
    return a;
  },
  async convertToTask(id:string, projectId:string, actorId?:string){
    const item = await this.getById(id);
    if (item.taskId) throw new AppError("Action item already converted", 400);
    const task = await prisma.task.create({ data: { projectId, title: item.title, description: item.description || `From meeting action item: ${item.meetingId}`, dueDate: item.dueDate || null, status: "TODO", priority: "MEDIUM" } });
    const a = await ActionItemsRepository.update(id, { taskId: task.id, status: "IN_PROGRESS" });
    await auditLog({ actorId, action: "action_item.convert_to_task", entityType: "MeetingActionItem", entityId: id, after: { taskId: task.id, projectId } });
    return a;
  },
};
