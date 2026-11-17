import { Router } from "express";
import { MembersController } from "./members.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createMemberSchema, updateMemberSchema } from "./members.validation";

export const membersRouter = Router();
membersRouter.use(authMiddleware);
membersRouter.get("/", validatePagination, MembersController.list);
membersRouter.get("/:id", MembersController.getById);
membersRouter.post("/", requireRoles("ADMIN", "COORDINATOR"), validateBody(createMemberSchema.shape.body), MembersController.create);
membersRouter.put("/:id", requireRoles("ADMIN", "COORDINATOR"), validateBody(updateMemberSchema.shape.body), MembersController.update);
membersRouter.delete("/:id", requireRoles("ADMIN", "COORDINATOR"), MembersController.remove);
