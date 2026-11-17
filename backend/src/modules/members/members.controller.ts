import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { MembersService } from "./members.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const MembersController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await MembersService.list(req.query), "Members list")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await MembersService.getById(req.params.id), "Member detail")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MembersService.create(req.body, req.user?.id), "Member created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MembersService.update(req.params.id, req.body, req.user?.id), "Member updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MembersService.remove(req.params.id, req.user?.id), "Member removed")),
};
