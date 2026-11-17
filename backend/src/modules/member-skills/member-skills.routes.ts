import { Router } from "express";
import { MemberSkillsController } from "./member-skills.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createSkillSchema, updateSkillSchema } from "./member-skills.validation";

export const memberSkillsRouter = Router();
memberSkillsRouter.use(authMiddleware);
memberSkillsRouter.get("/", validatePagination, MemberSkillsController.list);
memberSkillsRouter.get("/:id", MemberSkillsController.getById);
memberSkillsRouter.post("/", requireRoles("ADMIN", "COORDINATOR"), validateBody(createSkillSchema.shape.body), MemberSkillsController.create);
memberSkillsRouter.put("/:id", requireRoles("ADMIN", "COORDINATOR"), validateBody(updateSkillSchema.shape.body), MemberSkillsController.update);
memberSkillsRouter.delete("/:id", requireRoles("ADMIN", "COORDINATOR"), MemberSkillsController.remove);
