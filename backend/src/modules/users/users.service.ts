import { AppError } from "../../utils/AppError";
import { hashPassword } from "../../utils/auth";
import { auditLog } from "../../services/audit.service";
import { UsersRepository } from "./users.repository";

export const UsersService = {
  list: () => UsersRepository.list(),
  async getById(id: string) {
    const user = await UsersRepository.getById(id);
    if (!user) throw new AppError("User not found", 404);
    return user;
  },
  async create(payload: { name: string; email: string; password: string; role?: string }, actorId?: string) {
    const exists = await UsersRepository.findByEmail(payload.email.toLowerCase());
    if (exists) throw new AppError("Email already in use", 409);
    const passwordHash = await hashPassword(payload.password);
    const user = await UsersRepository.create({ name: payload.name, email: payload.email.toLowerCase(), passwordHash, role: payload.role || "MEMBER" });
    await auditLog({ actorId, action: "user.create", entityType: "User", entityId: user.id, after: { email: user.email, role: user.role } });
    return user;
  },
  async update(id: string, payload: any, actorId?: string) {
    const before = await this.getById(id);
    if (payload.email) payload.email = payload.email.toLowerCase();
    const user = await UsersRepository.update(id, payload);
    await auditLog({ actorId, action: "user.update", entityType: "User", entityId: id, before: { email: before.email, role: before.role, isActive: before.isActive }, after: { email: user.email, role: user.role, isActive: user.isActive } });
    return user;
  },
  async remove(id: string, actorId?: string) {
    const before = await this.getById(id);
    const user = await UsersRepository.softDelete(id);
    await auditLog({ actorId, action: "user.delete", entityType: "User", entityId: id, before: { email: before.email, role: before.role } });
    return user;
  },
  async activate(id: string, actorId?: string) { await this.getById(id); const user = await UsersRepository.update(id, { isActive: true }); await auditLog({ actorId, action: "user.activate", entityType: "User", entityId: id }); return user; },
  async deactivate(id: string, actorId?: string) { await this.getById(id); const user = await UsersRepository.update(id, { isActive: false }); await auditLog({ actorId, action: "user.deactivate", entityType: "User", entityId: id }); return user; },
  async assignRole(id: string, role: string, actorId?: string) { const before = await this.getById(id); const user = await UsersRepository.update(id, { role }); await auditLog({ actorId, action: "user.assign_role", entityType: "User", entityId: id, before: { role: before.role }, after: { role } }); return user; },
};
