import { z } from "zod";

export const progressCreateSchema = z.object({}).passthrough();
export const progressUpdateSchema = z.object({}).passthrough();
export const progressIdSchema = z.object({ id: z.string().min(1) });
