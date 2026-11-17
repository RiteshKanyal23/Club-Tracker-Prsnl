import { Router } from "express";
import { PermissionsController } from "./permissions.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createPermissionSchema, updatePermissionSchema } from "./permissions.validation";

export const permissionsRouter = Router();
permissionsRouter.use(authMiddleware, requireRoles("ADMIN"));
permissionsRouter.get("/", validatePagination, PermissionsController.list);
permissionsRouter.get("/:id", PermissionsController.getById);
permissionsRouter.post("/", validateBody(createPermissionSchema.shape.body), PermissionsController.create);
permissionsRouter.put("/:id", validateBody(updatePermissionSchema.shape.body), PermissionsController.update);
permissionsRouter.delete("/:id", PermissionsController.remove);
