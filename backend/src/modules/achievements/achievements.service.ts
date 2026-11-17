import { AppError } from "../../utils/AppError";
import { prisma } from "../../config/database";
import { auditLog } from "../../services/audit.service";
import { AchievementsRepository } from "./achievements.repository";

export const AchievementsService = {
  list: () => AchievementsRepository.list(),
  async getById(id: string) { const a = await AchievementsRepository.getById(id); if (!a) throw new AppError("Achievement not found", 404); return a; },
  async create(payload: any, actorId?: string) {
    const a = await AchievementsRepository.create(payload);
    await auditLog({ actorId, action: "achievement.create", entityType: "Achievement", entityId: a.id, after: { name: a.name } });
    return a;
  },
  async update(id: string, payload: any, actorId?: string) {
    const before = await this.getById(id);
    const a = await AchievementsRepository.update(id, payload);
    await auditLog({ actorId, action: "achievement.update", entityType: "Achievement", entityId: id, before: { name: before.name }, after: { name: a.name } });
    return a;
  },
  async remove(id: string, actorId?: string) {
    const before = await this.getById(id);
    const a = await AchievementsRepository.remove(id);
    await auditLog({ actorId, action: "achievement.delete", entityType: "Achievement", entityId: id, before: { name: before.name } });
    return a;
  },
  listAwards: (query: any) => AchievementsRepository.listAwards(query),
  async award(payload: any, awardedBy?: string) {
    const a = await AchievementsRepository.award({ ...payload, awardedBy });
    await auditLog({ actorId: awardedBy, action: "achievement.award", entityType: "MemberAchievement", entityId: a.id, after: { memberId: payload.memberId, achievementId: payload.achievementId } });
    return a;
  },
  async evaluateForMember(memberId: string, awardedBy?: string) {
    const member = await prisma.member.findUnique({ where: { id: memberId }, include: { taskAssignments: { include: { task: true } }, attendance: true } });
    if (!member) throw new AppError("Member not found", 404);
    const done = member.taskAssignments.filter(a => a.task?.status === "DONE").length;
    const attendance = member.attendance.filter(a => a.status === "PRESENT" || a.status === "LATE").length;
    const defs = await prisma.achievement.findMany();
    const ensure = async (name: string, description: string, criteriaKey: string, points: number, condition: boolean) => {
      let ach = defs.find(d => d.criteriaKey === criteriaKey || d.name === name);
      if (!ach) ach = await prisma.achievement.create({ data: { name, description, criteriaKey, points } });
      if (condition) await AchievementsRepository.award({ memberId, achievementId: ach.id, awardedBy, note: "Auto-awarded by evaluation" }).catch(() => {});
    };
    await ensure("Task Starter", "Completed 1+ tasks", "tasks_done_1", 10, done >= 1);
    await ensure("Task Achiever", "Completed 5+ tasks", "tasks_done_5", 30, done >= 5);
    await ensure("Consistent Attendee", "10+ attendance records present/late", "attendance_10", 20, attendance >= 10);
    return AchievementsRepository.listAwards({ memberId });
  },
};
