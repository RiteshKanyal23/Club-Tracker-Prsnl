import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { AnnouncementsService } from "./announcements.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const AnnouncementsController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await AnnouncementsService.list(req.query), "Announcements")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await AnnouncementsService.getById(req.params.id), "Announcement")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AnnouncementsService.create(req.body, req.user?.id), "Announcement created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AnnouncementsService.update(req.params.id, req.body, req.user?.id), "Announcement updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AnnouncementsService.remove(req.params.id, req.user?.id), "Announcement removed")),
  read: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AnnouncementsService.markRead(req.params.id, req.user!.id), "Marked as read")),
};
