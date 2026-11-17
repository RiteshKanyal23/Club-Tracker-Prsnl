import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { PermissionsService } from "./permissions.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const PermissionsController = {
  list: asyncHandler(async (_req: Request, res: Response) => ok(res, await PermissionsService.list(), "Permissions list")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await PermissionsService.getById(req.params.id), "Permission detail")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await PermissionsService.create(req.body, req.user?.id), "Permission created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await PermissionsService.update(req.params.id, req.body, req.user?.id), "Permission updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await PermissionsService.remove(req.params.id, req.user?.id), "Permission removed")),
};
