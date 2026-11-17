import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { TaskCommentsService } from "./task-comments.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const TaskCommentsController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await TaskCommentsService.list(req.query), "Task comments")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await TaskCommentsService.getById(req.params.id), "Task comment")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await TaskCommentsService.create(req.body, req.user!.id), "Comment created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await TaskCommentsService.update(req.params.id, req.body, req.user as any), "Comment updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await TaskCommentsService.remove(req.params.id, req.user as any), "Comment removed")),
};
