import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { TeamMembersService } from "./team-members.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const TeamMembersController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await TeamMembersService.list(req.query), "Team members list")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await TeamMembersService.getById(req.params.id), "Team member detail")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await TeamMembersService.add(req.body, req.user?.id), "Member added to team", 201)),
  update: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Not supported", 405)),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await TeamMembersService.remove(req.params.id, req.user?.id), "Member removed from team")),
};
