import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { ProjectHistoryService } from "./project-history.service";

export const ProjectHistoryController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await ProjectHistoryService.list(req.query.projectId as string | undefined), "Project history")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await ProjectHistoryService.getById(req.params.id), "Project history entry")),
  create: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "History is system-generated", 405)),
  update: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Not allowed", 405)),
  remove: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Not allowed", 405)),
};
