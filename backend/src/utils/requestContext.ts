import { AsyncLocalStorage } from "async_hooks";
import type { NextFunction, Request, Response } from "express";

export type RequestContext = {
  userId?: string;
  ip?: string | null;
  userAgent?: string | null;
};

const storage = new AsyncLocalStorage<RequestContext>();

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : Array.isArray(forwarded) ? forwarded[0] : undefined) ||
    req.ip ||
    (req.socket as any)?.remoteAddress ||
    null;
  const ctx: RequestContext = {
    ip,
    userAgent: (req.headers["user-agent"] as string | undefined) || null,
  };
  storage.run(ctx, () => next());
}

export function getRequestContext() {
  return storage.getStore();
}

export function setRequestUser(userId?: string) {
  const ctx = storage.getStore();
  if (ctx && userId) ctx.userId = userId;
}