import { z } from "zod";
export const createMilestoneSchema = z.object({ body: z.object({ projectId: z.string().min(1), title: z.string().min(1), description: z.string().optional().nullable(), dueDate: z.string().datetime().optional().nullable() }) });
export const updateMilestoneSchema = z.object({ body: z.object({ title: z.string().min(1).optional(), description: z.string().optional().nullable(), dueDate: z.string().datetime().optional().nullable() }) });
