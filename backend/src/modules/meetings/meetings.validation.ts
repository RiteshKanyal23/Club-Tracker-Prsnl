import { z } from "zod";
export const createMeetingSchema = z.object({ body: z.object({ title: z.string().min(1), agenda: z.string().optional(), scheduledAt: z.string(), location: z.string().optional(), teamId: z.string().optional(), projectId: z.string().optional() }) });
export const updateMeetingSchema = z.object({ body: z.object({ title: z.string().min(1).optional(), agenda: z.string().optional().nullable(), scheduledAt: z.string().optional(), location: z.string().optional().nullable(), teamId: z.string().optional().nullable(), projectId: z.string().optional().nullable() }) });
