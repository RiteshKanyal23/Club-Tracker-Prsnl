import { NextFunction, Request, Response } from "express";
import { z } from "zod";

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const validatePagination = (req: Request, _res: Response, next: NextFunction) => {
  const parsed = paginationQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const err = parsed.error as any;
    return _res.status(422).json({ success: false, data: null, message: "Validation failed", errors: err.flatten?.() ?? err.errors });
  }
  (req as any).validatedQuery = parsed.data;
  // keep query as object but normalized
  Object.assign(req.query, parsed.data);
  next();
};