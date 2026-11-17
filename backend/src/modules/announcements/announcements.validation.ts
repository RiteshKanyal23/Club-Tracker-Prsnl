import { z } from "zod";
export const createAnnouncementSchema = z.object({ body: z.object({ title: z.string().min(1), content: z.string().min(1), pinned: z.boolean().optional(), targetRoles: z.array(z.string()).optional(), targetTeams: z.array(z.string()).optional() }) });
export const updateAnnouncementSchema = z.object({ body: z.object({ title: z.string().optional(), content: z.string().optional(), pinned: z.boolean().optional(), targetRoles: z.array(z.string()).optional(), targetTeams: z.array(z.string()).optional() }) });
