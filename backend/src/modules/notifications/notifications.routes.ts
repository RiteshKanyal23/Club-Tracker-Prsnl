import { Router } from "express";
import { NotificationsController } from "./notifications.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createNotificationSchema, prefsSchema } from "./notifications.validation";

export const notificationsRouter = Router();
notificationsRouter.use(authMiddleware);
notificationsRouter.get("/", validatePagination, NotificationsController.list);
notificationsRouter.get("/preferences", NotificationsController.getPrefs);
notificationsRouter.put("/preferences", validateBody(prefsSchema.shape.body), NotificationsController.updatePrefs);
notificationsRouter.post("/read-all", NotificationsController.markAllRead);
notificationsRouter.post("/", requireRoles("ADMIN","COORDINATOR"), validateBody(createNotificationSchema.shape.body), NotificationsController.create);
notificationsRouter.get("/:id", NotificationsController.getById);
notificationsRouter.post("/:id/read", NotificationsController.markRead);
