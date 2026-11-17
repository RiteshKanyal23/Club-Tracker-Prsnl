import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { CommunicationService } from "./communication.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const CommunicationController = {
  listChannels: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await CommunicationService.listChannels(req.user!.id), "Channels")),
  createChannel: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await CommunicationService.createChannel(req.body, req.user!.id), "Channel created", 201)),
  getChannel: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await CommunicationService.getChannel(req.params.id, req.user!.id), "Channel")),
  join: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await CommunicationService.join(req.params.id, req.user!.id), "Joined channel")),
  markRead: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await CommunicationService.markRead(req.params.id, req.user!.id), "Channel marked read")),
  listMessages: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await CommunicationService.listMessages(req.params.id, req.user!.id), "Messages")),
  sendMessage: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await CommunicationService.sendMessage(req.params.id, req.user!.id, req.body, (req as any).file), "Message sent", 201)),

  // legacy
  list: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await CommunicationService.listChannels(req.user!.id), "Channels")),
  getById: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await CommunicationService.getChannel(req.params.id, req.user!.id), "Channel")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await CommunicationService.createChannel(req.body, req.user!.id), "Channel created", 201)),
  update: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Not supported", 405)),
  remove: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Not supported", 405)),
};
