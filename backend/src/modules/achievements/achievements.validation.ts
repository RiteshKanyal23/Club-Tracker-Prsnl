import { z } from "zod";

export const createAchievementSchema = z.object({ body: z.object({ name: z.string().min(1), description: z.string().optional(), criteriaKey: z.string().optional(), icon: z.string().optional(), points: z.number().int().min(0).optional() }) });
export const updateAchievementSchema = z.object({ body: z.object({ name: z.string().min(1).optional(), description: z.string().optional().nullable(), criteriaKey: z.string().optional().nullable(), icon: z.string().optional().nullable(), points: z.number().int().min(0).optional() }) });
export const awardAchievementSchema = z.object({ body: z.object({ memberId: z.string().min(1), achievementId: z.string().min(1), note: z.string().optional() }) });
