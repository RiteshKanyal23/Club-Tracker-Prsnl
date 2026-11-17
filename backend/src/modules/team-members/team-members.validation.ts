import { z } from "zod";
export const addTeamMemberSchema = z.object({ body: z.object({ teamId: z.string().min(1), memberId: z.string().min(1) }) });
export const teamMemberIdSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
