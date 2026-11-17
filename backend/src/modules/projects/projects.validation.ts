import { z } from "zod";

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"]).optional(),
    deadline: z.string().datetime().optional().nullable(),
    teamIds: z.array(z.string().min(1)).optional(),
  })
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"]).optional(),
    deadline: z.string().datetime().optional().nullable(),
    teamIds: z.array(z.string().min(1)).optional(),
  })
});
