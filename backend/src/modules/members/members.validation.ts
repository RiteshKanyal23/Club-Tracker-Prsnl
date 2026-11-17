import { z } from "zod";
export const createMemberSchema = z.object({ body: z.object({ userId: z.string().min(1), bio: z.string().optional().nullable() }) });
export const updateMemberSchema = z.object({ body: z.object({ bio: z.string().optional().nullable() }) });
