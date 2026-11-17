import fs from "fs";
import path from "path";
import { AppError } from "../../utils/AppError";
import { reportService } from "../../services/report.service";
import { auditLog } from "../../services/audit.service";
import { uploadDir } from "../../config/storage";
import { AttendanceRepository } from "./attendance.repository";

type ReqUser = { id: string; role?: string };

async function resolveScope(user?: ReqUser) {
  if (!user) return { isMember: false as const, memberId: undefined as string | undefined };
  if (user.role === "MEMBER") {
    const profile = await AttendanceRepository.findMemberByUserId(user.id);
    if (!profile) throw new AppError("Member profile not found", 404);
    return { isMember: true as const, memberId: profile.id };
  }
  return { isMember: false as const, memberId: undefined as string | undefined };
}

function assertStaff(user?: ReqUser) {
  const role = user?.role;
  if (!role || !["ADMIN", "COORDINATOR", "TEAM_LEADER"].includes(role)) {
    throw new AppError("Forbidden", 403);
  }
}

export const AttendanceService = {
  async list(query: any, user?: ReqUser) {
    const scope = await resolveScope(user);
    const q = { ...query };
    if (scope.isMember) q.memberId = scope.memberId;
    return AttendanceRepository.list(q);
  },

  async getById(id: string, user?: ReqUser) {
    const r = await AttendanceRepository.getById(id);
    if (!r) throw new AppError("Attendance record not found", 404);
    if (user?.role === "MEMBER") {
      const scope = await resolveScope(user);
      if (r.memberId !== scope.memberId) throw new AppError("Forbidden", 403);
    }
    return r;
  },

  async stats(query: any, user?: ReqUser) {
    const scope = await resolveScope(user);
    if (scope.isMember) {
      // member personal stats (history summary)
      const data = await AttendanceRepository.list({ memberId: scope.memberId, limit: 1000, page: 1 });
      const items = data.items as any[];
      const total = items.length;
      const present = items.filter(i => i.status === "PRESENT" || i.status === "LATE").length;
      const absent = items.filter(i => i.status === "ABSENT").length;
      const late = items.filter(i => i.status === "LATE").length;
      const excused = items.filter(i => i.status === "EXCUSED").length;
      const percentage = total ? Math.round((present / total) * 100) : 0;
      return { mode: "member", totalRecords: total, present, absent, late, excused, attendancePercentage: percentage };
    }
    return { mode: "staff", ...(await AttendanceRepository.todaySummary(query)) };
  },

  async create(payload: any, actorId?: string, user?: ReqUser) {
    assertStaff(user);
    if (payload.memberId && payload.date) {
      const existing = await AttendanceRepository.findByMemberDateSession(payload.memberId, payload.date, payload.sessionName ?? null);
      if (existing) throw new AppError("Attendance already recorded for this member/date/session", 409);
    }
    const r = await AttendanceRepository.create({ ...payload, markedById: actorId || payload.markedById || null });
    await auditLog({ actorId, action: "attendance.create", entityType: "Attendance", entityId: r.id, after: { memberId: r.memberId, status: r.status } });
    return r;
  },

  async capture(payload: any, file: Express.Multer.File | undefined, actorId?: string, user?: ReqUser) {
    assertStaff(user);
    if (!file) throw new AppError("Captured photo is required", 400);
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      try { fs.unlinkSync(file.path); } catch {}
      throw new AppError("Invalid image file", 400);
    }
    const confirm = String(payload.confirm ?? "false") === "true" || payload.confirm === true;
    if (!confirm) {
      try { fs.unlinkSync(file.path); } catch {}
      throw new AppError("Attendance confirmation is required", 400);
    }
    if (!payload.memberId) throw new AppError("Member identification is required", 400);
    const date = payload.date || new Date().toISOString();
    const sessionName = payload.sessionName || null;
    const existing = await AttendanceRepository.findByMemberDateSession(payload.memberId, date, sessionName);
    if (existing) {
      try { fs.unlinkSync(file.path); } catch {}
      throw new AppError("Duplicate attendance: record already exists for this member/date/session", 409);
    }
    const status = payload.status || "PRESENT";
    const r = await AttendanceRepository.create({
      memberId: payload.memberId,
      date,
      sessionName,
      status,
      checkIn: payload.checkIn || (status === "PRESENT" || status === "LATE" ? new Date().toISOString() : null),
      checkOut: payload.checkOut || null,
      notes: payload.notes || null,
      photoPath: path.basename(file.path),
      markedById: actorId || null,
    });
    await auditLog({ actorId, action: "attendance.capture", entityType: "Attendance", entityId: r.id, after: { memberId: r.memberId, status: r.status, photo: true } });
    return r;
  },

  async update(id: string, payload: any, actorId?: string, user?: ReqUser) {
    assertStaff(user);
    const before = await this.getById(id, { id: actorId || "", role: "ADMIN" });
    const r = await AttendanceRepository.update(id, payload);
    await auditLog({ actorId, action: "attendance.update", entityType: "Attendance", entityId: id, before: { status: before.status }, after: { status: r.status } });
    return r;
  },

  async remove(id: string, actorId?: string, user?: ReqUser) {
    const role = user?.role;
    if (!role || !["ADMIN", "COORDINATOR"].includes(role)) throw new AppError("Forbidden", 403);
    const before = await AttendanceRepository.getById(id);
    if (!before) throw new AppError("Attendance record not found", 404);
    if (before.photoPath) {
      const p = path.isAbsolute(before.photoPath) ? before.photoPath : path.join(uploadDir, before.photoPath);
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
    }
    const r = await AttendanceRepository.remove(id);
    await auditLog({ actorId, action: "attendance.delete", entityType: "Attendance", entityId: id, before: { memberId: before.memberId } });
    return r;
  },

  async checkIn(payload: { memberId: string; sessionName?: string; date?: string; notes?: string }, actorId?: string, user?: ReqUser) {
    assertStaff(user);
    const existing = await AttendanceRepository.findToday(payload.memberId, payload.date, payload.sessionName);
    if (existing && existing.checkIn && !existing.checkOut) return existing;
    let r;
    if (existing) {
      r = await AttendanceRepository.update(existing.id, { checkIn: new Date().toISOString(), status: "PRESENT", ...(payload.notes ? { notes: payload.notes } : {}), markedById: actorId || existing.markedById });
    } else {
      r = await AttendanceRepository.create({ memberId: payload.memberId, date: payload.date || new Date().toISOString(), sessionName: payload.sessionName, status: "PRESENT", checkIn: new Date().toISOString(), notes: payload.notes, markedById: actorId || null });
    }
    await auditLog({ actorId, action: "attendance.check_in", entityType: "Attendance", entityId: r.id, after: { memberId: r.memberId } });
    return r;
  },

  async checkOut(idOrMember: string, payload: any, byRecordId = true, actorId?: string, user?: ReqUser) {
    assertStaff(user);
    const rec = byRecordId ? await AttendanceRepository.getById(idOrMember) : await AttendanceRepository.findToday(idOrMember);
    if (!rec) throw new AppError("Attendance record not found", 404);
    const r = await AttendanceRepository.update(rec.id, { checkOut: payload?.checkOut || new Date().toISOString(), ...(payload?.notes ? { notes: payload.notes } : {}) });
    await auditLog({ actorId, action: "attendance.check_out", entityType: "Attendance", entityId: r.id, after: { memberId: r.memberId } });
    return r;
  },

  async report(query: any, user?: ReqUser) {
    const scope = await resolveScope(user);
    const q = { ...query, limit: 1000, page: 1 };
    if (scope.isMember) q.memberId = scope.memberId;
    const data = await AttendanceRepository.list(q);
    const items = data.items as any[];
    const summary = { total: items.length, present: items.filter((i: any) => i.status === "PRESENT").length, absent: items.filter((i: any) => i.status === "ABSENT").length, late: items.filter((i: any) => i.status === "LATE").length, excused: items.filter((i: any) => i.status === "EXCUSED").length };
    return { summary, items };
  },

  async exportCsv(query: any, user?: ReqUser) {
    const { items } = await this.report(query, user);
    const rows = (items as any[]).map((i: any) => ({ id: i.id, date: i.date, member: i.member?.user?.name, memberId: i.memberId, email: i.member?.user?.email, sessionName: i.sessionName || "", status: i.status, checkIn: i.checkIn || "", checkOut: i.checkOut || "", markedBy: i.markedBy?.name || i.markedBy?.email || "", hasPhoto: i.photoPath ? "yes" : "no" }));
    const csv = await reportService.generateCsv(rows);
    return csv;
  },

  async getPhotoPath(id: string, user?: ReqUser) {
    const r = await this.getById(id, user);
    if (!r.photoPath) throw new AppError("No photo for this record", 404);
    const filePath = path.isAbsolute(r.photoPath) ? r.photoPath : path.join(uploadDir, path.basename(r.photoPath));
    if (!fs.existsSync(filePath)) throw new AppError("Photo file not found", 404);
    return filePath;
  },
};
