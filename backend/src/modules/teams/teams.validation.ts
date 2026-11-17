import { z } from "zod";

export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    leaderId: z.string().optional().nullable(),
  })
});

export const updateTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    leaderId: z.string().optional().nullable(),
  })
});
