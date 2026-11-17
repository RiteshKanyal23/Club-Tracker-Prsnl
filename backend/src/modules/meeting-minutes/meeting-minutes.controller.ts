import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { MeetingMinutesService } from "./meeting-minutes.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const MeetingMinutesController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await MeetingMinutesService.list(req.query), "Meeting minutes")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await MeetingMinutesService.getById(req.params.id), "Meeting minutes")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MeetingMinutesService.upsert(req.body, req.user?.id), "Minutes saved", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MeetingMinutesService.upsert({ ...req.body, meetingId: req.body.meetingId || req.params.id }, req.user?.id), "Minutes updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await MeetingMinutesService.remove(req.params.id, req.user?.id), "Minutes removed")),
};
