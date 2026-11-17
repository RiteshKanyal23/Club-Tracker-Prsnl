import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { NotificationsService } from "./notifications.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const NotificationsController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await NotificationsService.list(req.user!.id, req.query), "Notifications")),
  getById: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await NotificationsService.getById(req.params.id, req.user!.id), "Notification")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await NotificationsService.create(req.body, req.user?.id), "Notification created", 201)),
  markRead: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await NotificationsService.markRead(req.params.id, req.user!.id), "Marked read")),
  markAllRead: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await NotificationsService.markAllRead(req.user!.id), "All marked read")),
  getPrefs: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await NotificationsService.getPrefs(req.user!.id), "Notification preferences")),
  updatePrefs: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await NotificationsService.updatePrefs(req.user!.id, req.body), "Preferences updated")),
  update: asyncHandler(async (_req, res)=>ok(res,null,"Not supported",405)),
  remove: asyncHandler(async (_req, res)=>ok(res,null,"Not supported",405)),
};
