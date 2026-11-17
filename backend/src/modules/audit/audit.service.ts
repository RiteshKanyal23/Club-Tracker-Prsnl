import { AppError } from "../../utils/AppError";
import { reportService } from "../../services/report.service";
import { AuditRepository } from "./audit.repository";

export const AuditService = {
  list: (query: any) => AuditRepository.list(query),
  async getById(id: string) { const a = await AuditRepository.getById(id); if (!a) throw new AppError("Audit log not found", 404); return a; },
  create: (payload: any) => AuditRepository.create(payload),
  async exportCsv(query: any) {
    const res = await AuditRepository.list({ ...query, page: 1, limit: 1000 });
    const rows = res.items.map((i: any) => ({ id: i.id, createdAt: i.createdAt, actor: i.actor?.email || i.actorId || "", action: i.action, entityType: i.entityType, entityId: i.entityId || "", ip: i.ip || "" }));
    return reportService.generateCsv(rows);
  },
  update: (_id: string, _p: unknown) => ({ message: "Audit logs are immutable" }),
  remove: (_id: string) => ({ message: "Audit logs are immutable" }),
};
