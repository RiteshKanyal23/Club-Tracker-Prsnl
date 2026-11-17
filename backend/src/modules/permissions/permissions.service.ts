import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { PermissionsRepository } from "./permissions.repository";

export const PermissionsService = {
  list: () => PermissionsRepository.list(),
  async getById(id: string) { const p = await PermissionsRepository.getById(id); if (!p) throw new AppError("Permission not found", 404); return p; },
  async create(payload: { key: string; description?: string }, actorId?: string) {
    const p = await PermissionsRepository.create(payload);
    await auditLog({ actorId, action: "permission.create", entityType: "Permission", entityId: p.id, after: { key: p.key } });
    return p;
  },
  async update(id: string, payload: any, actorId?: string) {
    const before = await this.getById(id);
    const p = await PermissionsRepository.update(id, payload);
    await auditLog({ actorId, action: "permission.update", entityType: "Permission", entityId: id, before: { key: before.key }, after: { key: p.key } });
    return p;
  },
  async remove(id: string, actorId?: string) {
    const before = await this.getById(id);
    const p = await PermissionsRepository.remove(id);
    await auditLog({ actorId, action: "permission.delete", entityType: "Permission", entityId: id, before: { key: before.key } });
    return p;
  },
};
