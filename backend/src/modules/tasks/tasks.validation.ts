import { z } from "zod";

const status = z.enum(["TODO","IN_PROGRESS","REVIEW","DONE"]);
const priority = z.enum(["LOW","MEDIUM","HIGH","URGENT"]);

export const createTaskSchema = z.object({ body: z.object({
  projectId: z.string().min(1),
  milestoneId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  status: status.optional(),
  priority: priority.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  order: z.number().int().optional(),
  assigneeIds: z.array(z.string().min(1)).optional(),
})});

export const updateTaskSchema = z.object({ body: z.object({
  milestoneId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: status.optional(),
  priority: priority.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  order: z.number().int().optional(),
  assigneeIds: z.array(z.string().min(1)).optional(),
})});

export const moveTaskSchema = z.object({ body: z.object({ status: status, order: z.number().int().optional() }) });
