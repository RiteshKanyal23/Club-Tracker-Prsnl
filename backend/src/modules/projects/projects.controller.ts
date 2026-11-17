import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { ProjectsService } from "./projects.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const ProjectsController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await ProjectsService.list(req.query), "Projects list")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await ProjectsService.getById(req.params.id), "Project detail")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await ProjectsService.create(req.body, req.user?.id), "Project created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await ProjectsService.update(req.params.id, req.body, req.user?.id), "Project updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await ProjectsService.remove(req.params.id, req.user?.id), "Project removed")),
};
