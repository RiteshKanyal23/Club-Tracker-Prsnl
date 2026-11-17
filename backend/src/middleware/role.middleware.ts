import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.middleware";
import { AppError } from "../utils/AppError";

export const requireRoles = (...roles: string[]) => (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user?.role) return next(new AppError("Unauthorized", 401));
  const current = String(req.user.role).toUpperCase();
  const allowed = roles.map((r) => String(r).toUpperCase());
  if (!allowed.includes(current)) return next(new AppError("Forbidden", 403));
  return next();
};
