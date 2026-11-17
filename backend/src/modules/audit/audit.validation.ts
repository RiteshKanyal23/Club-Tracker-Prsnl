import { z } from "zod";

export const auditCreateSchema = z.object({}).passthrough();
export const auditUpdateSchema = z.object({}).passthrough();
export const auditIdSchema = z.object({ id: z.string().min(1) });
