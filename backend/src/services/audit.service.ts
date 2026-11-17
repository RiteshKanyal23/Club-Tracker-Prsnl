import { prisma } from "../config/database";
import { getRequestContext } from "../utils/requestContext";

export async function auditLog(entry: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: any;
  after?: any;
  ip?: string | null;
}) {
  try {
    const ctx = getRequestContext();
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? ctx?.userId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        before: entry.before ?? null,
        after: entry.after ?? null,
        ip: entry.ip ?? ctx?.ip ?? null,
      },
    });
  } catch {
    // best-effort: audit logging must not break primary flow
  }
}