import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { MilestonesRepository } from "./milestones.repository";

function withProgress(m: any) {
  const total = m.tasks?.length || 0;
  const done = (m.tasks || []).filter((t: any) => t.status === "DONE").length;
  return { ...m, progress: { total, done, percent: total ? Math.round((done / total) * 100) : 0 } };
}

export const MilestonesService = {
  async list(query: any) { return (await MilestonesRepository.list(query)).map(withProgress); },
  async getById(id: string) { const m = await MilestonesRepository.getById(id); if (!m) throw new AppError("Milestone not found", 404); return withProgress(m); },
  async create(payload: any, actorId?: string) {
    const m = await MilestonesRepository.create(payload);
    await auditLog({ actorId, action: "milestone.create", entityType: "Milestone", entityId: m.id, after: { title: m.title } });
    return m;
  },
  async update(id: string, payload: any, actorId?: string) {
    const before = await this.getById(id);
    const m = await MilestonesRepository.update(id, payload);
    await auditLog({ actorId, action: "milestone.update", entityType: "Milestone", entityId: id, before: { title: before.title }, after: { title: m.title } });
    return m;
  },
  async remove(id: string, actorId?: string) {
    const before = await this.getById(id);
    const m = await MilestonesRepository.softDelete(id);
    await auditLog({ actorId, action: "milestone.delete", entityType: "Milestone", entityId: id, before: { title: before.title } });
    return m;
  },
};
