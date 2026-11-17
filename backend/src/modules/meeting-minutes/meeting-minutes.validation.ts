import { z } from "zod";
export const upsertMinutesSchema = z.object({ body: z.object({ meetingId: z.string().min(1), content: z.string().min(1) }) });
