import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { RolesService } from "./roles.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const RolesController = {
  list: asyncHandler(async (_req: Request, res: Response) => ok(res, await RolesService.list(), "Roles list")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await RolesService.getById(req.params.id), "Role detail")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await RolesService.create(req.body, req.user?.id), "Role created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await RolesService.update(req.params.id, req.body, req.user?.id), "Role updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await RolesService.remove(req.params.id, req.user?.id), "Role removed")),
  setPermissions: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await RolesService.setPermissions(req.params.id, req.body.permissionIds || [], req.user?.id), "Role permissions updated")),
};
