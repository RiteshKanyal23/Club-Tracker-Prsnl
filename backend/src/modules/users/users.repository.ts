import { prisma } from "../../config/database";

const selectSafe = { id: true, email: true, name: true, role: true, isActive: true, emailVerified: true, createdAt: true, updatedAt: true, deletedAt: true };

export const UsersRepository = {
  list() {
    return prisma.user.findMany({ where: { deletedAt: null }, select: selectSafe, orderBy: { createdAt: "desc" } });
  },
  getById(id: string) {
    return prisma.user.findFirst({ where: { id, deletedAt: null }, select: selectSafe });
  },
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  create(data: any) {
    return prisma.user.create({ data, select: selectSafe });
  },
  update(id: string, data: any) {
    return prisma.user.update({ where: { id }, data, select: selectSafe });
  },
  softDelete(id: string) {
    return prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false }, select: selectSafe });
  },
};
