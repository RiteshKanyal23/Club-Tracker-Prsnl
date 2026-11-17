import { z } from "zod";
export const createCommentSchema = z.object({ body: z.object({ taskId: z.string().min(1), content: z.string().min(1), mentions: z.array(z.string()).optional() }) });
export const updateCommentSchema = z.object({ body: z.object({ content: z.string().min(1).optional(), mentions: z.array(z.string()).optional() }) });
