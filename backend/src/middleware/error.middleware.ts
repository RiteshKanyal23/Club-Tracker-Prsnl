import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { fail } from "../utils/apiResponse";

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return fail(res, "Validation failed", 422, err.flatten());
  }
  if (err instanceof AppError) {
    return fail(res, err.message, err.statusCode, err.errors);
  }
  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }
  return fail(res, message, status);
}
