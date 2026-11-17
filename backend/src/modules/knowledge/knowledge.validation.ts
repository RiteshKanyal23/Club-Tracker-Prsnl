import { z } from "zod";
export const createArticleSchema = z.object({ body: z.object({ title: z.string().min(1), content: z.string().min(1), category: z.string().optional(), tags: z.array(z.string()).optional(), published: z.boolean().optional() }) });
export const updateArticleSchema = z.object({ body: z.object({ title: z.string().optional(), content: z.string().optional(), category: z.string().optional().nullable(), tags: z.array(z.string()).optional(), published: z.boolean().optional() }) });
