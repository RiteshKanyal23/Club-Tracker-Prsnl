import { Router } from "express";
import { MilestonesController } from "./milestones.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createMilestoneSchema, updateMilestoneSchema } from "./milestones.validation";

export const milestonesRouter = Router();
milestonesRouter.use(authMiddleware);
milestonesRouter.get("/", validatePagination, MilestonesController.list);
milestonesRouter.get("/:id", MilestonesController.getById);
milestonesRouter.post("/", requireRoles("ADMIN","PROJECT_MANAGER"), validateBody(createMilestoneSchema.shape.body), MilestonesController.create);
milestonesRouter.put("/:id", requireRoles("ADMIN","PROJECT_MANAGER"), validateBody(updateMilestoneSchema.shape.body), MilestonesController.update);
milestonesRouter.delete("/:id", requireRoles("ADMIN","PROJECT_MANAGER"), MilestonesController.remove);
