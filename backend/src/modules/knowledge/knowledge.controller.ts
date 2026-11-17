import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { KnowledgeService } from "./knowledge.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const KnowledgeController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await KnowledgeService.list(req.query), "Articles")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await KnowledgeService.getById(req.params.id), "Article")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await KnowledgeService.create(req.body, req.user?.id), "Article created", 201)),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await KnowledgeService.update(req.params.id, req.body, req.user?.id), "Article updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await KnowledgeService.remove(req.params.id, req.user?.id), "Article removed")),
};
