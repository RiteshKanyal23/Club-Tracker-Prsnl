import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { LeaveRepository } from "./leave.repository";

function daysBetween(a: Date, b: Date) { return Math.max(1, Math.ceil((b.getTime()-a.getTime())/(24*60*60*1000))+1); }

export const LeaveService = {
  list: (query: any) => LeaveRepository.list(query),
  async getById(id: string) { const r = await LeaveRepository.getById(id); if (!r) throw new AppError("Leave request not found", 404); return r; },
  async apply(payload: any) {
    const { requestedBy, ...data } = payload || {};
    const r = await LeaveRepository.create(data);
    await auditLog({ actorId: requestedBy, action: "leave.apply", entityType: "LeaveRequest", entityId: r.id, after: { memberId: r.memberId, startDate: r.startDate, endDate: r.endDate, status: r.status } });
    return r;
  },
  async review(id: string, payload: { status: "APPROVED"|"REJECTED"; remarks?: string }, approverId?: string) {
    const req = await this.getById(id);
    if (req.status !== "PENDING") throw new AppError("Leave request already reviewed", 400);
    const updated = await LeaveRepository.update(id, { status: payload.status, remarks: payload.remarks, approvedBy: approverId });
    if (payload.status === "APPROVED") {
      const days = daysBetween(new Date(req.startDate), new Date(req.endDate));
      await LeaveRepository.incrementUsed(req.memberId, days);
    }
    await auditLog({ actorId: approverId, action: "leave.review", entityType: "LeaveRequest", entityId: id, before: { status: req.status }, after: { status: payload.status, remarks: payload.remarks } });
    return updated;
  },
  async remove(id: string, actorId?: string) {
    const before = await this.getById(id);
    const r = await LeaveRepository.remove(id);
    await auditLog({ actorId, action: "leave.delete", entityType: "LeaveRequest", entityId: id, before: { memberId: before.memberId, status: before.status } });
    return r;
  },
  async getBalance(memberId: string) { return (await LeaveRepository.getBalance(memberId)) || { memberId, year: new Date().getFullYear(), total: 20, used: 0, remaining: 20 }; },
  async setBalance(payload: { memberId: string; year: number; total: number; used?: number }, actorId?: string) {
    const r = await LeaveRepository.upsertBalance(payload.memberId, payload.year, payload.total, payload.used);
    await auditLog({ actorId, action: "leave.balance_set", entityType: "LeaveBalance", entityId: (r as any).id || payload.memberId, after: { memberId: payload.memberId, year: payload.year, total: payload.total, used: payload.used } });
    return r;
  },
  async calendar(query: any) {
    const items = await LeaveRepository.list({ ...query, status: query.status || undefined });
    return items.map((r:any)=>({ id: r.id, memberId: r.memberId, member: r.member?.user?.name, start: r.startDate, end: r.endDate, status: r.status, reason: r.reason }));
  },
};
