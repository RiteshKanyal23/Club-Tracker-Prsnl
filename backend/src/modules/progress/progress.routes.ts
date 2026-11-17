import { Router } from "express";
import { ProgressController } from "./progress.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";

export const progressRouter = Router();
progressRouter.use(authMiddleware);
progressRouter.get("/", validatePagination, ProgressController.list);
progressRouter.get("/:projectId", ProgressController.getById);
