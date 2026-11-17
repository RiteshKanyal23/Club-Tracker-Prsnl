import { z } from "zod";

export const checkInSchema = z.object({ body: z.object({ memberId: z.string().min(1), sessionName: z.string().optional(), date: z.string().optional(), notes: z.string().optional() }) });
export const checkOutSchema = z.object({ body: z.object({ checkOut: z.string().datetime().optional(), notes: z.string().optional() }) });
export const createAttendanceSchema = z.object({ body: z.object({ memberId: z.string().min(1), date: z.string(), status: z.enum(["PRESENT","ABSENT","LATE","EXCUSED"]).optional(), sessionName: z.string().optional(), checkIn: z.string().optional().nullable(), checkOut: z.string().optional().nullable(), notes: z.string().optional() }) });
export const updateAttendanceSchema = z.object({ body: z.object({ status: z.enum(["PRESENT","ABSENT","LATE","EXCUSED"]).optional(), checkIn: z.string().optional().nullable(), checkOut: z.string().optional().nullable(), notes: z.string().optional(), sessionName: z.string().optional().nullable() }) });
