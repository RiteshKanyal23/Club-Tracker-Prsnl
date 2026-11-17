import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { TeamsRepository } from "./teams.repository";

export const TeamsService = {
  list: (query: any) => TeamsRepository.list(query),
  async getById(id: string) { const t = await TeamsRepository.getById(id); if (!t) throw new AppError("Team not found", 404); return t; },
  async create(payload: any, actorId?: string) {
    const t = await TeamsRepository.create(payload);
    await auditLog({ actorId, action: "team.create", entityType: "Team", entityId: t.id, after: { name: t.name } });
    return t;
  },
  async update(id: string, payload: any, actorId?: string) {
    const before = await this.getById(id);
    const t = await TeamsRepository.update(id, payload);
    await auditLog({ actorId, action: "team.update", entityType: "Team", entityId: id, before: { name: before.name }, after: { name: t.name } });
    return t;
  },
  async remove(id: string, actorId?: string) {
    const before = await this.getById(id);
    const t = await TeamsRepository.softDelete(id);
    await auditLog({ actorId, action: "team.delete", entityType: "Team", entityId: id, before: { name: before.name } });
    return t;
  },
};
