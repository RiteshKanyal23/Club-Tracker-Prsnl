import { z } from "zod";
export const createSkillSchema = z.object({ body: z.object({ memberId: z.string().min(1), name: z.string().min(1), proficiency: z.number().int().min(1).max(5) }) });
export const updateSkillSchema = z.object({ body: z.object({ name: z.string().min(1).optional(), proficiency: z.number().int().min(1).max(5).optional() }) });
