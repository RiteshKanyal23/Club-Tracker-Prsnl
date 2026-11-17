import { z } from "zod";
export const createFolderSchema = z.object({ body: z.object({ name: z.string().min(1), parentId: z.string().optional().nullable(), projectId: z.string().optional().nullable(), teamId: z.string().optional().nullable() }) });
export const createDocumentSchema = z.object({ body: z.object({ title: z.string().min(1), folderId: z.string().optional().nullable(), projectId: z.string().optional().nullable(), teamId: z.string().optional().nullable(), accessRoles: z.array(z.string()).optional() }) });
