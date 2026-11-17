import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const parsed = schema.parse({
    body: req.body,
    query: req.query,
    params: req.params,
  });
  (req as any).validated = parsed;
  next();
};

export const validateBody = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  req.body = schema.parse(req.body);
  next();
};
