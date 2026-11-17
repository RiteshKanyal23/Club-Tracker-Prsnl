import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { MemberSkillsRepository } from "./member-skills.repository";

export const MemberSkillsService = {
  list: (query: any) => MemberSkillsRepository.list(query),
  async getById(id: string) { const s = await MemberSkillsRepository.getById(id); if (!s) throw new AppError("Skill not found", 404); return s; },
  async create(payload: any, actorId?: string) {
    const s = await MemberSkillsRepository.create(payload);
    await auditLog({ actorId, action: "member_skill.create", entityType: "MemberSkill", entityId: s.id, after: { memberId: payload.memberId, name: payload.name } });
    return s;
  },
  async update(id: string, payload: any, actorId?: string) {
    await this.getById(id);
    const s = await MemberSkillsRepository.update(id, payload);
    await auditLog({ actorId, action: "member_skill.update", entityType: "MemberSkill", entityId: id });
    return s;
  },
  async remove(id: string, actorId?: string) {
    const before = await this.getById(id);
    const s = await MemberSkillsRepository.remove(id);
    await auditLog({ actorId, action: "member_skill.delete", entityType: "MemberSkill", entityId: id, before: { memberId: (before as any).memberId } });
    return s;
  },
};
