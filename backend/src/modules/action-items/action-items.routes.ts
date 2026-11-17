import { Router } from "express";
import { ActionItemsController } from "./action-items.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createActionItemSchema, updateActionItemSchema, convertActionItemSchema } from "./action-items.validation";

export const actionItemsRouter = Router();
actionItemsRouter.use(authMiddleware);
actionItemsRouter.get("/", validatePagination, ActionItemsController.list);
actionItemsRouter.get("/:id", ActionItemsController.getById);
actionItemsRouter.post("/", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), validateBody(createActionItemSchema.shape.body), ActionItemsController.create);
actionItemsRouter.post("/:id/convert-to-task", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), validateBody(convertActionItemSchema.shape.body), ActionItemsController.convert);
actionItemsRouter.put("/:id", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), validateBody(updateActionItemSchema.shape.body), ActionItemsController.update);
actionItemsRouter.delete("/:id", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), ActionItemsController.remove);
