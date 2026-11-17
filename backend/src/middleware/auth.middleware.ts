import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/environment";
import { AppError } from "../utils/AppError";
import { setRequestUser } from "../utils/requestContext";

export interface AuthRequest extends Request {
  user?: { id: string; role?: string; email?: string };
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
  if (!token) return next(new AppError("Unauthorized", 401));
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    setRequestUser(payload.sub);
    return next();
  } catch {
    return next(new AppError("Invalid or expired token", 401));
  }
}
