import { Router } from "express";
import { TeamsController } from "./teams.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createTeamSchema, updateTeamSchema } from "./teams.validation";

export const teamsRouter = Router();
teamsRouter.use(authMiddleware);
teamsRouter.get("/", validatePagination, TeamsController.list);
teamsRouter.get("/:id", TeamsController.getById);
teamsRouter.post("/", requireRoles("ADMIN", "COORDINATOR"), validateBody(createTeamSchema.shape.body), TeamsController.create);
teamsRouter.put("/:id", requireRoles("ADMIN", "COORDINATOR"), validateBody(updateTeamSchema.shape.body), TeamsController.update);
teamsRouter.delete("/:id", requireRoles("ADMIN", "COORDINATOR"), TeamsController.remove);
