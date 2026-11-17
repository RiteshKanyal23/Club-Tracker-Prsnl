import { z } from "zod";
export const createActionItemSchema = z.object({ body: z.object({ meetingId: z.string().min(1), title: z.string().min(1), description: z.string().optional(), assigneeId: z.string().optional(), dueDate: z.string().optional() }) });
export const updateActionItemSchema = z.object({ body: z.object({ title: z.string().optional(), description: z.string().optional().nullable(), assigneeId: z.string().optional().nullable(), dueDate: z.string().optional().nullable(), status: z.string().optional() }) });
export const convertActionItemSchema = z.object({ body: z.object({ projectId: z.string().min(1) }) });
