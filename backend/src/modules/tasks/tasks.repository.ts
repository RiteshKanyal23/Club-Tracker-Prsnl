import { prisma } from "../../config/database";

const include = {
  assignees: { include: { member: { include: { user: { select: { id: true, name: true, email: true } } } } } },
  comments: { orderBy: { createdAt: "desc" as const }, take: 20 },
  subtasks: { where: { deletedAt: null }, orderBy: { order: "asc" as const } },
  milestone: true,
};

export const TasksRepository = {
  async list(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 100));
    const where: any = { deletedAt: null };
    if (query.projectId) where.projectId = String(query.projectId);
    if (query.status) where.status = String(query.status);
    if (query.milestoneId) where.milestoneId = String(query.milestoneId);
    if (query.parentId) where.parentId = String(query.parentId);
    if (query.parentId === "null" || query.root === "true") where.parentId = null;
    if (query.assigneeId) where.assignees = { some: { memberId: String(query.assigneeId) } };
    if (query.search) where.title = { contains: String(query.search), mode: "insensitive" };
    const [items, total] = await Promise.all([
      prisma.task.findMany({ where, include, orderBy: [{ status: "asc" }, { order: "asc" }, { createdAt: "desc" }], skip: (page-1)*limit, take: limit }),
      prisma.task.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  },
  getById(id: string) { return prisma.task.findFirst({ where: { id, deletedAt: null }, include: { ...include, comments: { orderBy: { createdAt: "desc" } } } }); },
  async create(data: any) {
    const { assigneeIds, dueDate, ...rest } = data;
    return prisma.task.create({
      data: {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignees: assigneeIds?.length ? { create: assigneeIds.map((memberId: string) => ({ memberId })) } : undefined,
      },
      include,
    });
  },
  async update(id: string, data: any) {
    const { assigneeIds, dueDate, ...rest } = data;
    return prisma.task.update({
      where: { id },
      data: {
        ...rest,
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(assigneeIds ? { assignees: { deleteMany: {}, create: assigneeIds.map((memberId: string) => ({ memberId })) } } : {}),
      },
      include,
    });
  },
  softDelete(id: string) { return prisma.task.update({ where: { id }, data: { deletedAt: new Date() } }); },
};
