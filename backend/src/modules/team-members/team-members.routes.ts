import { Router } from "express";
import { TeamMembersController } from "./team-members.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { addTeamMemberSchema } from "./team-members.validation";

export const teamMembersRouter = Router();
teamMembersRouter.use(authMiddleware);
teamMembersRouter.get("/", validatePagination, TeamMembersController.list);
teamMembersRouter.get("/:id", TeamMembersController.getById);
teamMembersRouter.post("/", requireRoles("ADMIN", "COORDINATOR"), validateBody(addTeamMemberSchema.shape.body), TeamMembersController.create);
teamMembersRouter.delete("/:id", requireRoles("ADMIN", "COORDINATOR"), TeamMembersController.remove);
