import { z } from "zod";
export const createNotificationSchema = z.object({ body: z.object({ userId: z.string().min(1), type: z.enum(["INFO","TASK","MEETING","LEAVE","ANNOUNCEMENT","SYSTEM"]).optional(), title: z.string().min(1), body: z.string().optional(), data: z.any().optional() }) });
export const prefsSchema = z.object({ body: z.object({ inApp: z.boolean().optional(), email: z.boolean().optional(), taskUpdates: z.boolean().optional(), meetingReminders: z.boolean().optional(), announcements: z.boolean().optional() }) });
