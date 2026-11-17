import { z } from "zod";

export const createRoleSchema = z.object({ body: z.object({ name: z.string().min(2), description: z.string().optional() }) });
export const updateRoleSchema = z.object({ body: z.object({ name: z.string().min(2).optional(), description: z.string().optional() }) });
export const setPermissionsSchema = z.object({ body: z.object({ permissionIds: z.array(z.string().min(1)) }) });
