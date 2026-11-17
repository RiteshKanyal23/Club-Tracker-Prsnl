import { Router } from "express";
import { TasksController } from "./tasks.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createTaskSchema, updateTaskSchema, moveTaskSchema } from "./tasks.validation";

export const tasksRouter = Router();
tasksRouter.use(authMiddleware);
tasksRouter.get("/", validatePagination, TasksController.list);
tasksRouter.get("/:id", TasksController.getById);
tasksRouter.post("/", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), validateBody(createTaskSchema.shape.body), TasksController.create);
tasksRouter.put("/:id", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), validateBody(updateTaskSchema.shape.body), TasksController.update);
tasksRouter.patch("/:id/move", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), validateBody(moveTaskSchema.shape.body), TasksController.move);
tasksRouter.delete("/:id", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), TasksController.remove);
