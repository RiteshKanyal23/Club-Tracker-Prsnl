import { prisma } from "../../config/database";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function resolveRange(params?: { days?: number; range?: string; from?: string; to?: string }) {
  const now = new Date();
  const range = (params?.range || "").toLowerCase();
  if (range === "this_month") {
    const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return { start, end };
  }
  if (range === "last_month") {
    const start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
    return { start, end };
  }
  if (params?.from || params?.to) {
    const start = params?.from ? startOfDay(new Date(params.from)) : startOfDay(addDays(now, -13));
    const end = params?.to ? endOfDay(new Date(params.to)) : endOfDay(now);
    return { start, end };
  }
  const days = Math.max(1, Math.min(90, Number(params?.days || 14)));
  const start = startOfDay(addDays(now, -(days - 1)));
  const end = endOfDay(now);
  return { start, end, days };
}

export const AnalyticsRepository = {
  async overview() {
    const now = new Date();
    const [users, projects, tasks, teams, meetings, openLeaves, members] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.team.count({ where: { deletedAt: null } }),
      prisma.meeting.count(),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.member.count(),
    ]);
    const [tasksByStatus, projectsByStatus, overdueTasks] = await Promise.all([
      prisma.task.groupBy({ by: ["status"], _count: { _all: true }, where: { deletedAt: null } }),
      prisma.project.groupBy({ by: ["status"], _count: { _all: true }, where: { deletedAt: null } }),
      prisma.task.count({ where: { deletedAt: null, status: { not: "DONE" }, dueDate: { lt: startOfDay(now) } } }),
    ]);
    const attendanceRecent = await prisma.attendanceRecord.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { date: { gte: startOfDay(addDays(now, -29)) } },
    });

    const taskStatusCounts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 } as Record<string, number>;
    tasksByStatus.forEach((x) => { taskStatusCounts[x.status] = x._count._all; });
    const totalTasks = tasks;
    const completedTasks = taskStatusCounts.DONE || 0;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totals: { users, members, projects, tasks, teams, meetings, openLeaves, attendance: attendanceRecent.reduce((a, b) => a + b._count._all, 0) },
      tasksByStatus: tasksByStatus.map((x) => ({ status: x.status, count: x._count._all })),
      taskSummary: {
        total: totalTasks,
        completed: completedTasks,
        pending: taskStatusCounts.TODO || 0,
        inProgress: (taskStatusCounts.IN_PROGRESS || 0) + (taskStatusCounts.REVIEW || 0),
        review: taskStatusCounts.REVIEW || 0,
        overdue: overdueTasks,
        completionRate,
      },
      projectsByStatus: projectsByStatus.map((x) => ({ status: x.status, count: x._count._all })),
      attendanceLast30Days: attendanceRecent.map((x) => ({ status: x.status, count: x._count._all })),
    };
  },

  async workload(params?: { range?: string; days?: number; from?: string; to?: string }) {
    const { start, end } = resolveRange(params);
    const members = await prisma.member.findMany({
      include: {
        user: { select: { id: true, name: true } },
        taskAssignments: { include: { task: { select: { id: true, status: true, deletedAt: true, createdAt: true, updatedAt: true } } } },
      },
    });
    const memberLoad = members
      .map((m) => {
        let assigned = 0, completed = 0, pending = 0, inProgress = 0;
        m.taskAssignments.forEach((a) => {
          const t = a.task;
          if (!t || t.deletedAt) return;
          // Include tasks relevant to selected period (created or updated in range, or still active)
          const inRange = (t.createdAt >= start && t.createdAt <= end) || (t.updatedAt >= start && t.updatedAt <= end) || t.status !== "DONE";
          if (!inRange) return;
          assigned++;
          if (t.status === "DONE") completed++;
          else if (t.status === "TODO") pending++;
          else if (t.status === "IN_PROGRESS" || t.status === "REVIEW") inProgress++;
        });
        const productivity = assigned ? Math.round((completed / assigned) * 100) : 0;
        return {
          memberId: m.id,
          userId: m.userId,
          name: m.user?.name || "Member",
          assigned,
          completed,
          pending,
          inProgress,
          productivity,
          // legacy fields
          activeTasks: pending + inProgress,
          doneTasks: completed,
          totalAssigned: assigned,
        };
      })
      .filter((m) => m.assigned > 0 || m.completed > 0 || m.pending > 0 || m.inProgress > 0)
      .sort((a, b) => b.completed - a.completed || b.productivity - a.productivity || b.assigned - a.assigned);

    const teams = await prisma.team.findMany({
      include: { members: { include: { member: { include: { taskAssignments: { include: { task: true } } } } } } },
      where: { deletedAt: null },
    });
    const teamLoad = teams.map((t) => {
      let active = 0;
      t.members.forEach((tm) =>
        tm.member.taskAssignments.forEach((a) => {
          if (a.task && !a.task.deletedAt && a.task.status !== "DONE") active++;
        }),
      );
      return { teamId: t.id, name: t.name, members: t.members.length, activeTasks: active };
    });

    return { memberLoad, teamLoad, range: { start, end } };
  },

  async trends(params?: { days?: number; range?: string; from?: string; to?: string }) {
    const { start, end } = resolveRange(params);
    const [attendance, tasksDone, tasksCreated, totalMembers] = await Promise.all([
      prisma.attendanceRecord.findMany({ where: { date: { gte: start, lte: end } }, select: { date: true, status: true } }),
      prisma.task.findMany({ where: { status: "DONE", updatedAt: { gte: start, lte: end }, deletedAt: null }, select: { updatedAt: true } }),
      prisma.task.findMany({ where: { createdAt: { gte: start, lte: end }, deletedAt: null }, select: { createdAt: true } }),
      prisma.member.count(),
    ]);

    const byDay: Record<string, any> = {};
    const cursor = startOfDay(new Date(start));
    const last = startOfDay(new Date(end));
    while (cursor <= last) {
      const k = cursor.toISOString().slice(0, 10);
      byDay[k] = {
        date: k,
        present: 0,
        absent: 0,
        attendancePercentage: 0,
        tasksCreated: 0,
        tasksCompleted: 0,
        activityCount: 0,
        // legacy
        tasksDone: 0,
        leaveRequests: 0,
      };
      cursor.setDate(cursor.getDate() + 1);
    }

    attendance.forEach((a) => {
      const k = startOfDay(new Date(a.date)).toISOString().slice(0, 10);
      if (!byDay[k]) return;
      if (a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED") byDay[k].present++;
      else if (a.status === "ABSENT") byDay[k].absent++;
    });
    tasksDone.forEach((t) => {
      const k = startOfDay(new Date(t.updatedAt)).toISOString().slice(0, 10);
      if (byDay[k]) byDay[k].tasksCompleted++;
    });
    tasksCreated.forEach((t) => {
      const k = startOfDay(new Date(t.createdAt)).toISOString().slice(0, 10);
      if (byDay[k]) byDay[k].tasksCreated++;
    });

    Object.values(byDay).forEach((d: any) => {
      const denom = d.present + d.absent;
      d.attendancePercentage = denom ? Math.round((d.present / denom) * 100) : 0;
      d.activityCount = d.tasksCreated + d.tasksCompleted;
      d.tasksDone = d.tasksCompleted; // legacy
    });

    return Object.values(byDay).sort((a: any, b: any) => a.date.localeCompare(b.date));
  },
};
