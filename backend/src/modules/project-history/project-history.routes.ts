import { Router } from "express";
import { ProjectHistoryController } from "./project-history.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";

export const projectHistoryRouter = Router();
projectHistoryRouter.use(authMiddleware);
projectHistoryRouter.get("/", validatePagination, ProjectHistoryController.list);
projectHistoryRouter.get("/:id", ProjectHistoryController.getById);
