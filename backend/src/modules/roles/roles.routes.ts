import { Router } from "express";
import { RolesController } from "./roles.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createRoleSchema, updateRoleSchema, setPermissionsSchema } from "./roles.validation";

export const rolesRouter = Router();
rolesRouter.use(authMiddleware, requireRoles("ADMIN"));
rolesRouter.get("/", validatePagination, RolesController.list);
rolesRouter.get("/:id", RolesController.getById);
rolesRouter.post("/", validateBody(createRoleSchema.shape.body), RolesController.create);
rolesRouter.put("/:id", validateBody(updateRoleSchema.shape.body), RolesController.update);
rolesRouter.delete("/:id", RolesController.remove);
rolesRouter.put("/:id/permissions", validateBody(setPermissionsSchema.shape.body), RolesController.setPermissions);
