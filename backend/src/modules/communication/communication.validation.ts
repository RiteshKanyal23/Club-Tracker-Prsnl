import { z } from "zod";

export const createChannelSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    type: z.enum(["TEAM", "PROJECT", "GENERAL"]),
    teamId: z.string().optional().nullable(),
    projectId: z.string().optional().nullable(),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().optional(),
  }),
});
