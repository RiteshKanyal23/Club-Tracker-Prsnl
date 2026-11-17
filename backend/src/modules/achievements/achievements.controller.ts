import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { AchievementsService } from "./achievements.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const AchievementsController = {
  list: asyncHandler(async (_req: Request, res: Response) => ok(res, await AchievementsService.list(), "Achievements")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await AchievementsService.getById(req.params.id), "Achievement")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AchievementsService.create(req.body, req.user?.id), "Achievement created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AchievementsService.update(req.params.id, req.body, req.user?.id), "Achievement updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AchievementsService.remove(req.params.id, req.user?.id), "Achievement removed")),
  listAwards: asyncHandler(async (req: Request, res: Response) => ok(res, await AchievementsService.listAwards(req.query), "Achievement awards")),
  award: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AchievementsService.award(req.body, req.user?.id), "Achievement awarded", 201)),
  evaluate: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AchievementsService.evaluateForMember(req.body.memberId || req.params.memberId, req.user?.id), "Achievements evaluated")),
};
