import { z } from "zod";
export const applyLeaveSchema = z.object({ body: z.object({ memberId: z.string().min(1), startDate: z.string(), endDate: z.string(), reason: z.string().min(3) }) });
export const reviewLeaveSchema = z.object({ body: z.object({ status: z.enum(["APPROVED","REJECTED"]), remarks: z.string().optional() }) });
export const setBalanceSchema = z.object({ body: z.object({ memberId: z.string().min(1), year: z.number().int(), total: z.number().int().min(0), used: z.number().int().min(0).optional() }) });
