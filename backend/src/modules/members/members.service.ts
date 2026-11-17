import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { MembersRepository } from "./members.repository";

export const MembersService = {
  list: (query: any) => MembersRepository.list(query),
  async getById(id: string) { const m = await MembersRepository.getById(id); if (!m) throw new AppError("Member not found", 404); return m; },
  async create(payload: any, actorId?: string) {
    const m = await MembersRepository.create(payload);
    await auditLog({ actorId, action: "member.create", entityType: "MemberProfile", entityId: m.id, after: { userId: (m as any).userId } });
    return m;
  },
  async update(id: string, payload: any, actorId?: string) {
    await this.getById(id);
    const m = await MembersRepository.update(id, payload);
    await auditLog({ actorId, action: "member.update", entityType: "MemberProfile", entityId: id });
    return m;
  },
  async remove(id: string, actorId?: string) {
    await this.getById(id);
    const m = await MembersRepository.remove(id);
    await auditLog({ actorId, action: "member.delete", entityType: "MemberProfile", entityId: id });
    return m;
  },
};
