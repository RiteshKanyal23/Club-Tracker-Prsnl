import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { FeedbackService } from "./feedback.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const FeedbackController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await FeedbackService.list(req.query, req.user), "Feedback")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await FeedbackService.getById(req.params.id), "Feedback detail")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await FeedbackService.create(req.body, req.user!.id), "Feedback created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await FeedbackService.update(req.params.id, req.body, req.user), "Feedback updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await FeedbackService.remove(req.params.id, req.user), "Feedback removed")),
};
