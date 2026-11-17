import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { UsersService } from "./users.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const UsersController = {
  list: asyncHandler(async (_req: Request, res: Response) => ok(res, await UsersService.list(), "Users list")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await UsersService.getById(req.params.id), "User detail")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await UsersService.create(req.body, req.user?.id), "User created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await UsersService.update(req.params.id, req.body, req.user?.id), "User updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await UsersService.remove(req.params.id, req.user?.id), "User removed")),
  activate: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await UsersService.activate(req.params.id, req.user?.id), "User activated")),
  deactivate: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await UsersService.deactivate(req.params.id, req.user?.id), "User deactivated")),
  assignRole: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await UsersService.assignRole(req.params.id, req.body.role, req.user?.id), "Role assigned")),
};
