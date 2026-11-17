import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { AnalyticsService } from "./analytics.service";

export const AnalyticsController = {
  overview: asyncHandler(async (_req: Request, res: Response) => ok(res, await AnalyticsService.overview(), "Analytics overview")),
  workload: asyncHandler(async (req: Request, res: Response) => ok(res, await AnalyticsService.workload({
    range: req.query.range as string | undefined,
    days: req.query.days ? Number(req.query.days) : undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  }), "Workload analytics")),
  trends: asyncHandler(async (req: Request, res: Response) => ok(res, await AnalyticsService.trends({
    days: req.query.days ? Number(req.query.days) : undefined,
    range: req.query.range as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  }), "Analytics trends")),
  list: asyncHandler(async (_req: Request, res: Response) => ok(res, await AnalyticsService.overview(), "Analytics overview")),
  getById: asyncHandler(async (_req: Request, res: Response) => ok(res, await AnalyticsService.overview(), "Analytics overview")),
  create: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Not supported", 405)),
  update: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Not supported", 405)),
  remove: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Not supported", 405)),
};
