import { z } from "zod";

export const analyticsCreateSchema = z.object({}).passthrough();
export const analyticsUpdateSchema = z.object({}).passthrough();
export const analyticsIdSchema = z.object({ id: z.string().min(1) });
