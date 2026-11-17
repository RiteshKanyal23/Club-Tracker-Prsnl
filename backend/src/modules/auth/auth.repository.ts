import { prisma } from "../../config/database";
import { TokenType } from "@prisma/client";

export const AuthRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, include: { memberProfile: true } });
  },
  findUserById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: { memberProfile: true } });
  },
  findUserByAdminId(adminId: string) {
    return prisma.user.findFirst({ where: { adminId } });
  },
  findMemberByMemberId(memberId: string) {
    return prisma.member.findUnique({ where: { memberId }, include: { user: true } });
  },
  createUser(data: { name: string; email: string; passwordHash: string; role?: any; adminId?: string | null; emailVerified?: boolean; isActive?: boolean }) {
    return prisma.user.create({ data: { ...data, role: data.role || "MEMBER" } as any });
  },
  createMemberProfile(data: { userId: string; memberId?: string | null; phone?: string | null; teamName?: string | null }) {
    return prisma.member.create({ data: data as any });
  },
  updateUser(id: string, data: any) {
    return prisma.user.update({ where: { id }, data });
  },
  createRefreshToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data });
  },
  findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
  },
  revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  },
  revokeAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  },
  createAuthToken(data: { userId: string; type: TokenType; tokenHash: string; expiresAt: Date }) {
    return prisma.authToken.create({ data });
  },
  findValidAuthToken(tokenHash: string, type: TokenType) {
    return prisma.authToken.findFirst({ where: { tokenHash, type, usedAt: null, expiresAt: { gt: new Date() } }, include: { user: true } });
  },
  findAuthTokenByHash(tokenHash: string, type: TokenType) {
    return prisma.authToken.findFirst({ where: { tokenHash, type }, include: { user: true } });
  },
  markAuthTokenUsed(id: string) {
    return prisma.authToken.update({ where: { id }, data: { usedAt: new Date() } });
  },
  findRecentAuthToken(userId: string, type: TokenType, since: Date) {
    return prisma.authToken.findFirst({ where: { userId, type, createdAt: { gte: since } }, orderBy: { createdAt: "desc" } });
  },
  invalidateUnusedAuthTokens(userId: string, type: TokenType) {
    return prisma.authToken.updateMany({ where: { userId, type, usedAt: null }, data: { usedAt: new Date() } });
  },
};
