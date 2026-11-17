import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { LeaveService } from "./leave.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const LeaveController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await LeaveService.list(req.query), "Leave requests")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await LeaveService.getById(req.params.id), "Leave request")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await LeaveService.apply({ ...req.body, requestedBy: req.user?.id }), "Leave applied", 201)),
  review: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await LeaveService.review(req.params.id, req.body, req.user?.id), "Leave reviewed")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await LeaveService.remove(req.params.id, req.user?.id), "Leave removed")),
  balance: asyncHandler(async (req: Request, res: Response) => ok(res, await LeaveService.getBalance(String(req.query.memberId || req.params.memberId)), "Leave balance")),
  setBalance: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await LeaveService.setBalance(req.body, req.user?.id), "Leave balance updated")),
  calendar: asyncHandler(async (req: Request, res: Response) => ok(res, await LeaveService.calendar(req.query), "Leave calendar")),
  update: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Use review endpoint", 405)),
};
