import { z } from "zod";

export const createPermissionSchema = z.object({ body: z.object({ key: z.string().min(2), description: z.string().optional() }) });
export const updatePermissionSchema = z.object({ body: z.object({ key: z.string().min(2).optional(), description: z.string().optional() }) });
