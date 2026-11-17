import { prisma } from "../../config/database";

const includeFull = {
  member: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
  markedBy: { select: { id: true, name: true, email: true, role: true } },
};

function dayBounds(dateLike?: string | Date) {
  const base = dateLike ? new Date(dateLike) : new Date();
  const start = new Date(base); start.setHours(0, 0, 0, 0);
  const end = new Date(base); end.setHours(23, 59, 59, 999);
  return { start, end };
}

export const AttendanceRepository = {
  async list(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));
    const where: any = {};
    if (query.memberId) where.memberId = String(query.memberId);
    if (query.sessionName) where.sessionName = { contains: String(query.sessionName), mode: "insensitive" };
    if (query.status) where.status = String(query.status).toUpperCase();
    if (query.teamId) where.member = { teamLinks: { some: { teamId: String(query.teamId) } } };
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(String(query.from));
      if (query.to) where.date.lte = new Date(String(query.to));
    } else if (query.month && query.year) {
      const y = Number(query.year), m = Number(query.month) - 1;
      where.date = { gte: new Date(y, m, 1), lt: new Date(y, m + 1, 1) };
    } else if (query.date) {
      const { start, end } = dayBounds(String(query.date));
      where.date = { gte: start, lte: end };
    }
    const [items, total] = await Promise.all([
      prisma.attendanceRecord.findMany({ where, include: includeFull, orderBy: [{ date: "desc" }, { createdAt: "desc" }], skip: (page - 1) * limit, take: limit }),
      prisma.attendanceRecord.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },
  getById(id: string) { return prisma.attendanceRecord.findUnique({ where: { id }, include: includeFull }); },
  create(data: any) {
    return prisma.attendanceRecord.create({
      data: {
        memberId: data.memberId,
        date: new Date(data.date),
        sessionName: data.sessionName ?? null,
        status: data.status ?? "PRESENT",
        checkIn: data.checkIn ? new Date(data.checkIn) : null,
        checkOut: data.checkOut ? new Date(data.checkOut) : null,
        notes: data.notes ?? null,
        photoPath: data.photoPath ?? null,
        markedById: data.markedById ?? null,
      },
      include: includeFull,
    });
  },
  update(id: string, data: any) {
    return prisma.attendanceRecord.update({
      where: { id },
      data: {
        ...(data.memberId !== undefined ? { memberId: data.memberId } : {}),
        ...(data.date ? { date: new Date(data.date) } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.sessionName !== undefined ? { sessionName: data.sessionName } : {}),
        ...(data.checkIn !== undefined ? { checkIn: data.checkIn ? new Date(data.checkIn) : null } : {}),
        ...(data.checkOut !== undefined ? { checkOut: data.checkOut ? new Date(data.checkOut) : null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.photoPath !== undefined ? { photoPath: data.photoPath } : {}),
        ...(data.markedById !== undefined ? { markedById: data.markedById } : {}),
      },
      include: includeFull,
    });
  },
  remove(id: string) { return prisma.attendanceRecord.delete({ where: { id } }); },
  async findToday(memberId: string, dateStr?: string, sessionName?: string) {
    const { start, end } = dayBounds(dateStr);
    return prisma.attendanceRecord.findFirst({ where: { memberId, date: { gte: start, lte: end }, ...(sessionName ? { sessionName } : {}) }, include: includeFull, orderBy: { createdAt: "desc" } });
  },
  async findByMemberDateSession(memberId: string, dateStr: string, sessionName?: string | null) {
    const { start, end } = dayBounds(dateStr);
    return prisma.attendanceRecord.findFirst({ where: { memberId, date: { gte: start, lte: end }, sessionName: sessionName ? String(sessionName) : null } as any, include: includeFull });
  },
  async todaySummary(query: any = {}) {
    const { start, end } = dayBounds(query.date);
    const where: any = { date: { gte: start, lte: end } };
    if (query.teamId) where.member = { teamLinks: { some: { teamId: String(query.teamId) } } };
    const [totalMembers, grouped] = await Promise.all([
      prisma.member.count({ where: { user: { isActive: true, deletedAt: null } } }),
      prisma.attendanceRecord.groupBy({ by: ["status"], where, _count: { _all: true } }),
    ]);
    const counts: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    grouped.forEach((g) => { counts[g.status] = g._count._all; });
    const presentToday = counts.PRESENT + counts.LATE; // late still attended
    const absentToday = Math.max(0, totalMembers - (counts.PRESENT + counts.LATE + counts.EXCUSED));
    const attendancePercentage = totalMembers ? Math.round(((counts.PRESENT + counts.LATE) / totalMembers) * 100) : 0;
    return {
      date: start.toISOString(),
      totalMembers,
      presentToday,
      absentToday,
      lateArrivals: counts.LATE,
      excusedToday: counts.EXCUSED,
      attendancePercentage,
      marked: counts.PRESENT + counts.LATE + counts.ABSENT + counts.EXCUSED,
    };
  },
  findMemberByUserId(userId: string) { return prisma.member.findUnique({ where: { userId }, select: { id: true, userId: true } }); },
};
