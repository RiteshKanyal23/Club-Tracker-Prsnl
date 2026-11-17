import { Router } from "express";
import { AnnouncementsController } from "./announcements.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createAnnouncementSchema, updateAnnouncementSchema } from "./announcements.validation";

export const announcementsRouter = Router();
announcementsRouter.use(authMiddleware);
announcementsRouter.get("/", validatePagination, AnnouncementsController.list);
announcementsRouter.get("/:id", AnnouncementsController.getById);
announcementsRouter.post("/", requireRoles("ADMIN","COORDINATOR"), validateBody(createAnnouncementSchema.shape.body), AnnouncementsController.create);
announcementsRouter.post("/:id/read", AnnouncementsController.read);
announcementsRouter.put("/:id", requireRoles("ADMIN","COORDINATOR"), validateBody(updateAnnouncementSchema.shape.body), AnnouncementsController.update);
announcementsRouter.delete("/:id", requireRoles("ADMIN","COORDINATOR"), AnnouncementsController.remove);
