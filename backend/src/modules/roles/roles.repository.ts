import { prisma } from "../../config/database";

export const RolesRepository = {
  list() { return prisma.role.findMany({ include: { permissions: { include: { permission: true } } }, orderBy: { name: "asc" } }); },
  getById(id: string) { return prisma.role.findUnique({ where: { id }, include: { permissions: { include: { permission: true } } } }); },
  create(data: { name: string; description?: string }) { return prisma.role.create({ data }); },
  update(id: string, data: any) { return prisma.role.update({ where: { id }, data }); },
  remove(id: string) { return prisma.role.delete({ where: { id } }); },
  setPermissions(roleId: string, permissionIds: string[]) {
    return prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      prisma.rolePermission.createMany({ data: permissionIds.map(permissionId => ({ roleId, permissionId })), skipDuplicates: true }),
    ]);
  },
};
