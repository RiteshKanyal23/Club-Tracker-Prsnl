import { Router } from "express";
import { AuditController } from "./audit.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { requireRoles } from "../../middleware/role.middleware";

export const auditRouter = Router();
auditRouter.use(authMiddleware, requireRoles("ADMIN", "COORDINATOR"));

auditRouter.get("/", validatePagination, AuditController.list);
auditRouter.get("/export/csv", AuditController.exportCsv);
auditRouter.get("/:id", AuditController.getById);
