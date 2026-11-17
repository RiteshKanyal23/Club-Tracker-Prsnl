import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER","MEMBER"]).optional(),
  })
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(["ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER","MEMBER"]).optional(),
    isActive: z.boolean().optional(),
  })
});

export const assignRoleSchema = z.object({
  body: z.object({ role: z.enum(["ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER","MEMBER"]) })
});
