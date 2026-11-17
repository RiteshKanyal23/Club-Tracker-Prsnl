import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { MilestonesService } from "./milestones.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const MilestonesController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await MilestonesService.list(req.query), "Milestones list")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await MilestonesService.getById(req.params.id), "Milestone detail")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MilestonesService.create(req.body, req.user?.id), "Milestone created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MilestonesService.update(req.params.id, req.body, req.user?.id), "Milestone updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MilestonesService.remove(req.params.id, req.user?.id), "Milestone removed")),
};
