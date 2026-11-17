import { z } from "zod";

export const createFeedbackSchema = z.object({ body: z.object({
  toUserId: z.string().optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(1),
}) });

export const updateFeedbackSchema = z.object({ body: z.object({
  status: z.enum(["OPEN", "REVIEWED", "RESOLVED"]).optional(),
  response: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
}) });
