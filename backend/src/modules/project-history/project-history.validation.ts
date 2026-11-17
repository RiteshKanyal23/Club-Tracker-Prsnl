import { z } from "zod";

export const projectHistoryCreateSchema = z.object({}).passthrough();
export const projectHistoryUpdateSchema = z.object({}).passthrough();
export const projectHistoryIdSchema = z.object({ id: z.string().min(1) });
