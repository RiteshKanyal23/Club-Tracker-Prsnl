import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Response } from "express";
import { env } from "../config/environment";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function signAccessToken(payload: { sub: string; role: string; email: string }) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] });
}

export function signRefreshToken(payload: { sub: string; tokenId: string }) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; tokenId: string; iat: number; exp: number };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const base = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.COOKIE_SAME_SITE as "lax" | "strict" | "none",
    path: "/",
  };
  res.cookie("accessToken", accessToken, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res: Response) {
  const base = { httpOnly: true, secure: env.cookieSecure, sameSite: env.COOKIE_SAME_SITE as any, path: "/" };
  res.clearCookie("accessToken", base);
  res.clearCookie("refreshToken", base);
}

export function parseExpiryToDate(expiresIn: string) {
  const m = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!m) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const n = Number(m[1]);
  const unit = m[2];
  const mult = unit === "s" ? 1000 : unit === "m" ? 60000 : unit === "h" ? 3600000 : 86400000;
  return new Date(Date.now() + n * mult);
}
