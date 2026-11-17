import { Router } from "express";
import { ProjectsController } from "./projects.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createProjectSchema, updateProjectSchema } from "./projects.validation";

export const projectsRouter = Router();

projectsRouter.use(authMiddleware);
projectsRouter.get("/", validatePagination, ProjectsController.list);
projectsRouter.get("/:id", ProjectsController.getById);
projectsRouter.post("/", requireRoles("ADMIN", "PROJECT_MANAGER"), validateBody(createProjectSchema.shape.body), ProjectsController.create);
projectsRouter.put("/:id", requireRoles("ADMIN", "PROJECT_MANAGER"), validateBody(updateProjectSchema.shape.body), ProjectsController.update);
projectsRouter.delete("/:id", requireRoles("ADMIN", "PROJECT_MANAGER"), ProjectsController.remove);
