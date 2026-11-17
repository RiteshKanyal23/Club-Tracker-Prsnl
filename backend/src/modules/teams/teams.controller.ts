import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { TeamsService } from "./teams.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const TeamsController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await TeamsService.list(req.query), "Teams list")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await TeamsService.getById(req.params.id), "Team detail")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await TeamsService.create(req.body, req.user?.id), "Team created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await TeamsService.update(req.params.id, req.body, req.user?.id), "Team updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await TeamsService.remove(req.params.id, req.user?.id), "Team removed")),
};
