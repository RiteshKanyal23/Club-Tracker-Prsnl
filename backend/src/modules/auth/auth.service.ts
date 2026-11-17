import { TokenType } from "@prisma/client";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/environment";
import { emailService } from "../../services/email.service";
import { auditLog } from "../../services/audit.service";
import { AuthRepository } from "./auth.repository";
import {
  comparePassword, hashPassword, signAccessToken, signRefreshToken, verifyRefreshToken,
  generateRandomToken, hashToken, parseExpiryToDate, setAuthCookies, clearAuthCookies
} from "../../utils/auth";
import { Response } from "express";

function safeUser(u: any) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}

function appBase() {
  return (env.frontendUrl || env.APP_URL || env.CORS_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
}

function portalPath(portal?: "admin" | "member", kind: "verify" | "reset" = "verify") {
  if (portal === "admin") return kind === "verify" ? "/admin/verify-email" : "/admin/reset-password";
  if (portal === "member") return kind === "verify" ? "/member/verify-email" : "/member/reset-password";
  return kind === "verify" ? "/verify-email" : "/reset-password";
}

async function issueTokens(res: Response, user: any) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  const rawRefresh = generateRandomToken();
  const refreshJwt = signRefreshToken({ sub: user.id, tokenId: rawRefresh.slice(0, 16) });
  const refreshHash = hashToken(refreshJwt);
  await AuthRepository.createRefreshToken({ userId: user.id, tokenHash: refreshHash, expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRES_IN) });
  setAuthCookies(res, accessToken, refreshJwt);
  return { accessToken };
}

async function sendVerificationEmail(user: any, portal?: "admin" | "member") {
  await AuthRepository.invalidateUnusedAuthTokens(user.id, TokenType.EMAIL_VERIFICATION);
  const raw = generateRandomToken();
  await AuthRepository.createAuthToken({ userId: user.id, type: TokenType.EMAIL_VERIFICATION, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
  const link = `${appBase()}${portalPath(portal, "verify")}?token=${encodeURIComponent(raw)}`;
  const subject = "Verify your Team Algebra account";
  const text = `Welcome to Team Algebra Club Tracker.\n\nVerify your email using this secure link (expires in 24 hours):\n${link}\n\nIf you did not create this account, you can ignore this email.`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a"><h2>Team Algebra Club Tracker</h2><p>Verify your email address to activate your account.</p><p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:10px">Verify Email</a></p><p>This secure link expires in 24 hours.</p><p style="color:#475569;font-size:13px">If you did not request this, you can safely ignore this email.</p><p style="font-size:12px;color:#64748b">${link}</p></div>`;
  await emailService.send(user.email, subject, text, html);
}

async function sendResetEmail(user: any, portal?: "admin" | "member") {
  await AuthRepository.invalidateUnusedAuthTokens(user.id, TokenType.PASSWORD_RESET);
  const raw = generateRandomToken();
  await AuthRepository.createAuthToken({ userId: user.id, type: TokenType.PASSWORD_RESET, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
  const link = `${appBase()}${portalPath(portal, "reset")}?token=${encodeURIComponent(raw)}`;
  const subject = "Reset your Team Algebra password";
  const text = `Team Algebra Club Tracker password reset requested.\n\nReset your password using this secure link (expires in 60 minutes):\n${link}\n\nIf you did not request this reset, please ignore this email and your password will remain unchanged.`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a"><h2>Team Algebra Club Tracker</h2><p>We received a request to reset your password.</p><p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:10px">Reset Password</a></p><p>This secure, single-use link expires in 60 minutes.</p><p style="color:#b91c1c;font-size:13px">Security warning: If you did not request this reset, ignore this email.</p><p style="font-size:12px;color:#64748b">${link}</p></div>`;
  await emailService.send(user.email, subject, text, html);
}

export const AuthService = {
  async register(res: Response, data: { name: string; email: string; password: string }) {
    const existing = await AuthRepository.findUserByEmail(data.email.toLowerCase());
    if (existing) throw new AppError("Email already in use", 409);
    const passwordHash = await hashPassword(data.password);
    const user = await AuthRepository.createUser({ name: data.name, email: data.email.toLowerCase(), passwordHash, emailVerified: false, isActive: true });
    // create member profile by default for generic registration
    await AuthRepository.createMemberProfile({ userId: user.id }).catch(() => {});
    await sendVerificationEmail(user, "member");
    await auditLog({ actorId: user.id, action: "auth.register", entityType: "User", entityId: user.id, after: { email: user.email } });
    return { user: safeUser(user), requiresEmailVerification: true };
  },

  async registerAdmin(data: { fullName: string; email: string; adminId: string; password: string }) {
    const email = data.email.toLowerCase();
    const existing = await AuthRepository.findUserByEmail(email);
    if (existing) throw new AppError("Email already in use", 409);
    const existingAdminId = await AuthRepository.findUserByAdminId(data.adminId);
    if (existingAdminId) throw new AppError("Admin ID already in use", 409);
    const passwordHash = await hashPassword(data.password);
    const user = await AuthRepository.createUser({ name: data.fullName, email, passwordHash, role: "ADMIN" as any, adminId: data.adminId, emailVerified: false, isActive: true });
    await sendVerificationEmail(user, "admin");
    await auditLog({ actorId: user.id, action: "auth.register_admin", entityType: "User", entityId: user.id, after: { email: user.email, role: "ADMIN" } });
    return { user: safeUser(user), requiresEmailVerification: true, message: "Admin account created. Please verify your email before logging in." };
  },

  async registerMember(data: { fullName: string; memberId: string; email: string; phoneNumber?: string | null; teamName?: string | null; password: string }) {
    const email = data.email.toLowerCase();
    const existing = await AuthRepository.findUserByEmail(email);
    if (existing) throw new AppError("Email already in use", 409);
    const existingMember = await AuthRepository.findMemberByMemberId(data.memberId);
    if (existingMember && existingMember.userId) {
      // if linked to an active/verified account, block duplicate claim
      const linked = existingMember.user;
      if (linked && (linked.emailVerified || linked.isActive)) {
        throw new AppError("Member ID is already registered", 409);
      }
    }
    if (existingMember && existingMember.userId) throw new AppError("Member ID is already in use", 409);
    const passwordHash = await hashPassword(data.password);
    const user = await AuthRepository.createUser({ name: data.fullName, email, passwordHash, role: "MEMBER" as any, emailVerified: false, isActive: true });
    if (existingMember && !existingMember.userId) {
      // unlikely with current schema, but handle claim case
      await (AuthRepository as any).updateUser(user.id, {}); // noop
    }
    try {
      await AuthRepository.createMemberProfile({ userId: user.id, memberId: data.memberId, phone: data.phoneNumber || null, teamName: data.teamName || null });
    } catch (e: any) {
      // unique constraint fallback
      throw new AppError("Member ID is already in use", 409);
    }
    await sendVerificationEmail(user, "member");
    await auditLog({ actorId: user.id, action: "auth.register_member", entityType: "User", entityId: user.id, after: { email: user.email, role: "MEMBER" } });
    return { user: safeUser(user), requiresEmailVerification: true, message: "Registration successful. Please verify your email before logging in." };
  },

  async login(res: Response, data: { email: string; password: string; portal?: "admin" | "member" }) {
    const identifier = data.email.trim();
    let user = await AuthRepository.findUserByEmail(identifier.toLowerCase());
    if (!user && data.portal === "member") {
      const member = await AuthRepository.findMemberByMemberId(identifier);
      if (member?.user) user = await AuthRepository.findUserById(member.userId);
    }
    if (!user && data.portal === "admin") {
      const admin = await AuthRepository.findUserByAdminId(identifier);
      if (admin) user = await AuthRepository.findUserById(admin.id);
    }
    if (!user || user.deletedAt) throw new AppError("Invalid credentials", 401);
    if (!user.isActive) throw new AppError("Account is inactive", 403);
    const ok = await comparePassword(data.password, user.passwordHash);
    if (!ok) throw new AppError("Invalid credentials", 401);
    if (data.portal === "admin" && user.role !== "ADMIN") {
      throw new AppError("Access denied. Admin credentials required for the Admin Portal.", 403);
    }
    if (data.portal === "member" && user.role !== "MEMBER") {
      throw new AppError("Access denied. Member credentials required for the Member Portal.", 403);
    }
    if (!user.emailVerified) {
      throw new AppError("Please verify your email address before logging in.", 403);
    }
    const tokens = await issueTokens(res, user);
    await auditLog({ actorId: user.id, action: "auth.login", entityType: "User", entityId: user.id, after: { email: user.email, portal: data.portal || null } });
    return { user: safeUser(user), ...tokens };
  },

  async logout(res: Response, refreshToken?: string) {
    let actorId: string | undefined;
    if (refreshToken) {
      const hash = hashToken(refreshToken);
      const stored = await AuthRepository.findRefreshTokenByHash(hash);
      if (stored) actorId = stored.userId;
      if (stored && !stored.revokedAt) await AuthRepository.revokeRefreshToken(stored.id);
    }
    clearAuthCookies(res);
    await auditLog({ actorId, action: "auth.logout", entityType: "User", entityId: actorId });
    return { loggedOut: true };
  },

  async refresh(res: Response, refreshToken?: string) {
    if (!refreshToken) throw new AppError("Refresh token missing", 401);
    try { verifyRefreshToken(refreshToken); } catch { throw new AppError("Invalid refresh token", 401); }
    const hash = hashToken(refreshToken);
    const stored = await AuthRepository.findRefreshTokenByHash(hash);
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw new AppError("Refresh token expired or revoked", 401);
    await AuthRepository.revokeRefreshToken(stored.id);
    const user = stored.user;
    if (!user || !user.isActive || user.deletedAt) throw new AppError("Unauthorized", 401);
    if (!user.emailVerified) throw new AppError("Unauthorized", 401);
    const tokens = await issueTokens(res, user);
    return { user: safeUser(user), ...tokens };
  },

  async forgotPassword(data: { email: string; portal?: "admin" | "member" }) {
    const user = await AuthRepository.findUserByEmail(data.email.toLowerCase());
    // generic response to avoid account enumeration
    if (user && user.isActive && !user.deletedAt) {
      await sendResetEmail(user, data.portal);
    }
    return { requested: true, message: "If an account exists for that email, a secure password reset link has been sent." };
  },

  async resetPassword(data: { token: string; password: string }) {
    const stored = await AuthRepository.findValidAuthToken(hashToken(data.token), TokenType.PASSWORD_RESET);
    if (!stored) throw new AppError("Invalid or expired reset token", 400);
    const passwordHash = await hashPassword(data.password);
    await AuthRepository.updateUser(stored.userId, { passwordHash });
    await AuthRepository.markAuthTokenUsed(stored.id);
    await AuthRepository.revokeAllUserRefreshTokens(stored.userId);
    await auditLog({ actorId: stored.userId, action: "auth.reset_password", entityType: "User", entityId: stored.userId });
    return { reset: true, message: "Your password has been successfully updated." };
  },

  async changePassword(userId: string, data: { currentPassword: string; newPassword: string }) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) throw new AppError("User not found", 404);
    const ok = await comparePassword(data.currentPassword, user.passwordHash);
    if (!ok) throw new AppError("Current password incorrect", 400);
    const passwordHash = await hashPassword(data.newPassword);
    await AuthRepository.updateUser(userId, { passwordHash });
    await AuthRepository.revokeAllUserRefreshTokens(userId);
    await auditLog({ actorId: userId, action: "auth.change_password", entityType: "User", entityId: userId });
    return { changed: true };
  },

  async verifyEmail(data: { token: string }) {
    const tokenHash = hashToken(data.token);
    const stored = await AuthRepository.findValidAuthToken(tokenHash, TokenType.EMAIL_VERIFICATION);
    if (!stored) {
      const any = await (AuthRepository as any).findAuthTokenByHash?.(tokenHash, TokenType.EMAIL_VERIFICATION);
      if (!any) throw new AppError("Invalid verification link.", 400);
      if (any.user?.emailVerified) throw new AppError("Email is already verified.", 400);
      if (any.expiresAt <= new Date()) throw new AppError("Verification link has expired.", 400);
      if (any.usedAt) throw new AppError("Verification link has expired.", 400);
      throw new AppError("Invalid verification link.", 400);
    }
    if (stored.user?.emailVerified) {
      if (!stored.usedAt) await AuthRepository.markAuthTokenUsed(stored.id);
      return { verified: true, message: "Email is already verified." };
    }
    await AuthRepository.updateUser(stored.userId, { emailVerified: true });
    await AuthRepository.markAuthTokenUsed(stored.id);
    await auditLog({ actorId: stored.userId, action: "auth.verify_email", entityType: "User", entityId: stored.userId });
    return { verified: true, message: "Email verified successfully." };
  },

  async resendVerification(data: { email: string; portal?: "admin" | "member" }) {
    const user = await AuthRepository.findUserByEmail(data.email.toLowerCase());
    if (!user || user.deletedAt) {
      return { sent: true, message: "If an eligible account exists, a verification email has been sent." };
    }
    if (user.emailVerified) {
      return { sent: true, message: "If an eligible account exists, a verification email has been sent." };
    }
    const recent = await AuthRepository.findRecentAuthToken(user.id, TokenType.EMAIL_VERIFICATION, new Date(Date.now() - 2 * 60 * 1000));
    if (recent) {
      throw new AppError("Please wait before requesting another verification email.", 429);
    }
    await sendVerificationEmail(user, data.portal);
    return { sent: true, message: "If an eligible account exists, a verification email has been sent." };
  },

  async me(userId: string) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) throw new AppError("User not found", 404);
    return { user: safeUser(user) };
  },
};
