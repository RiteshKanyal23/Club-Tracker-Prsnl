import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { TasksService } from "./tasks.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const TasksController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await TasksService.list(req.query), "Tasks list")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await TasksService.getById(req.params.id), "Task detail")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await TasksService.create(req.body, req.user?.id), "Task created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await TasksService.update(req.params.id, req.body, req.user?.id), "Task updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await TasksService.remove(req.params.id, req.user?.id), "Task removed")),
  move: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await TasksService.move(req.params.id, req.body, req.user?.id), "Task moved")),
};
