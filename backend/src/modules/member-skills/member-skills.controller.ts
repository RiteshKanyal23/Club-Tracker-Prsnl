import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { MemberSkillsService } from "./member-skills.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const MemberSkillsController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await MemberSkillsService.list(req.query), "Member skills list")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await MemberSkillsService.getById(req.params.id), "Member skill detail")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MemberSkillsService.create(req.body, req.user?.id), "Member skill created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MemberSkillsService.update(req.params.id, req.body, req.user?.id), "Member skill updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MemberSkillsService.remove(req.params.id, req.user?.id), "Member skill removed")),
};
