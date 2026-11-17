import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { ProgressService } from "./progress.service";

export const ProgressController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await ProgressService.list(req.query), "Progress")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await ProgressService.project(req.params.projectId || req.params.id), "Project progress")),
  create: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Computed resource", 405)),
  update: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Computed resource", 405)),
  remove: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Computed resource", 405)),
};
