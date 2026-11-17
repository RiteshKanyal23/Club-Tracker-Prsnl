import { Router } from "express";
import { MeetingMinutesController } from "./meeting-minutes.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { upsertMinutesSchema } from "./meeting-minutes.validation";

export const meetingMinutesRouter = Router();
meetingMinutesRouter.use(authMiddleware);
meetingMinutesRouter.get("/", validatePagination, MeetingMinutesController.list);
meetingMinutesRouter.get("/:id", MeetingMinutesController.getById);
meetingMinutesRouter.post("/", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), validateBody(upsertMinutesSchema.shape.body), MeetingMinutesController.create);
meetingMinutesRouter.put("/:id", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), MeetingMinutesController.update);
meetingMinutesRouter.delete("/:id", requireRoles("ADMIN","COORDINATOR"), MeetingMinutesController.remove);
