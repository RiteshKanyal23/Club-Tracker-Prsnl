import { Router } from "express";
import { MeetingsController } from "./meetings.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createMeetingSchema, updateMeetingSchema } from "./meetings.validation";

export const meetingsRouter = Router();
meetingsRouter.use(authMiddleware);
meetingsRouter.get("/", validatePagination, MeetingsController.list);
meetingsRouter.get("/:id", MeetingsController.getById);
meetingsRouter.post("/", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), validateBody(createMeetingSchema.shape.body), MeetingsController.create);
meetingsRouter.put("/:id", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), validateBody(updateMeetingSchema.shape.body), MeetingsController.update);
meetingsRouter.delete("/:id", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), MeetingsController.remove);
