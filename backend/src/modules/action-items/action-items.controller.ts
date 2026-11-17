import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { ActionItemsService } from "./action-items.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const ActionItemsController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await ActionItemsService.list(req.query), "Action items")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await ActionItemsService.getById(req.params.id), "Action item")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await ActionItemsService.create(req.body, req.user?.id), "Action item created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await ActionItemsService.update(req.params.id, req.body, req.user?.id), "Action item updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await ActionItemsService.remove(req.params.id, req.user?.id), "Action item removed")),
  convert: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await ActionItemsService.convertToTask(req.params.id, req.body.projectId, req.user?.id), "Action item converted to task")),
};
