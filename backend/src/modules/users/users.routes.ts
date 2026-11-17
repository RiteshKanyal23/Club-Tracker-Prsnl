import { Router } from "express";
import { UsersController } from "./users.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createUserSchema, updateUserSchema, assignRoleSchema } from "./users.validation";

export const usersRouter = Router();

usersRouter.use(authMiddleware, requireRoles("ADMIN"));
usersRouter.get("/", validatePagination, UsersController.list);
usersRouter.get("/:id", UsersController.getById);
usersRouter.post("/", validateBody(createUserSchema.shape.body), UsersController.create);
usersRouter.put("/:id", validateBody(updateUserSchema.shape.body), UsersController.update);
usersRouter.delete("/:id", UsersController.remove);
usersRouter.patch("/:id/activate", UsersController.activate);
usersRouter.patch("/:id/deactivate", UsersController.deactivate);
usersRouter.patch("/:id/role", validateBody(assignRoleSchema.shape.body), UsersController.assignRole);
