import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { TeamMembersRepository } from "./team-members.repository";

export const TeamMembersService = {
  list: (query: any) => TeamMembersRepository.list(query),
  async getById(id: string) { const r = await TeamMembersRepository.getById(id); if (!r) throw new AppError("Team member not found", 404); return r; },
  async add(payload: { teamId: string; memberId: string }, actorId?: string) {
    const r = await TeamMembersRepository.add(payload.teamId, payload.memberId);
    await auditLog({ actorId, action: "team_member.add", entityType: "TeamMember", entityId: r.id, after: { teamId: payload.teamId, memberId: payload.memberId } });
    return r;
  },
  async remove(id: string, actorId?: string) {
    const before = await this.getById(id);
    const r = await TeamMembersRepository.remove(id);
    await auditLog({ actorId, action: "team_member.remove", entityType: "TeamMember", entityId: id, before: { teamId: (before as any).teamId, memberId: (before as any).memberId } });
    return r;
  },
};
