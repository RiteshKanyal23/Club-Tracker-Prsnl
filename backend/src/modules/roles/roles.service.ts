import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { RolesRepository } from "./roles.repository";

export const RolesService = {
  list: () => RolesRepository.list(),
  async getById(id: string) { const r = await RolesRepository.getById(id); if (!r) throw new AppError("Role not found", 404); return r; },
  async create(payload: { name: string; description?: string }, actorId?: string) {
    const r = await RolesRepository.create(payload);
    await auditLog({ actorId, action: "role.create", entityType: "Role", entityId: r.id, after: { name: r.name } });
    return r;
  },
  async update(id: string, payload: any, actorId?: string) {
    const before = await this.getById(id);
    const r = await RolesRepository.update(id, payload);
    await auditLog({ actorId, action: "role.update", entityType: "Role", entityId: id, before: { name: before.name }, after: { name: r.name } });
    return r;
  },
  async remove(id: string, actorId?: string) {
    const before = await this.getById(id);
    const r = await RolesRepository.remove(id);
    await auditLog({ actorId, action: "role.delete", entityType: "Role", entityId: id, before: { name: before.name } });
    return r;
  },
  async setPermissions(id: string, permissionIds: string[], actorId?: string) {
    await this.getById(id);
    await RolesRepository.setPermissions(id, permissionIds);
    const r = await this.getById(id);
    await auditLog({ actorId, action: "role.set_permissions", entityType: "Role", entityId: id, after: { permissionCount: permissionIds.length } });
    return r;
  },
};
