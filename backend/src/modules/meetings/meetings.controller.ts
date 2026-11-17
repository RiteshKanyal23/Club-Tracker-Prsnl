import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { MeetingsService } from "./meetings.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const MeetingsController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await MeetingsService.list(req.query), "Meetings")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await MeetingsService.getById(req.params.id), "Meeting")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MeetingsService.create(req.body, req.user?.id), "Meeting created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MeetingsService.update(req.params.id, req.body, req.user?.id), "Meeting updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MeetingsService.remove(req.params.id, req.user?.id), "Meeting removed")),
};
