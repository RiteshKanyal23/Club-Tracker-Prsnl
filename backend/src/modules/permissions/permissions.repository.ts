import { prisma } from "../../config/database";

export const PermissionsRepository = {
  list() { return prisma.permission.findMany({ orderBy: { key: "asc" } }); },
  getById(id: string) { return prisma.permission.findUnique({ where: { id } }); },
  create(data: { key: string; description?: string }) { return prisma.permission.create({ data }); },
  update(id: string, data: any) { return prisma.permission.update({ where: { id }, data }); },
  remove(id: string) { return prisma.permission.delete({ where: { id } }); },
};
