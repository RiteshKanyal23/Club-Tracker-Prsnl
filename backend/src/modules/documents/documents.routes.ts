import { Router } from "express";
import { DocumentsController } from "./documents.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { upload } from "../../middleware/upload.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createFolderSchema } from "./documents.validation";

export const documentsRouter = Router();
documentsRouter.use(authMiddleware);

// Folders
documentsRouter.get("/folders", DocumentsController.listFolders);
documentsRouter.post("/folders", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), validateBody(createFolderSchema.shape.body), DocumentsController.createFolder);
documentsRouter.get("/folders/:id", DocumentsController.getFolder);
documentsRouter.delete("/folders/:id", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), DocumentsController.deleteFolder);

// Documents
documentsRouter.get("/", validatePagination, DocumentsController.listDocs);
documentsRouter.get("/download", DocumentsController.download);
documentsRouter.get("/:id", DocumentsController.getDoc);
documentsRouter.get("/:id/download", DocumentsController.download);
documentsRouter.post("/", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER","MEMBER"), upload.single("file"), DocumentsController.createDoc);
documentsRouter.post("/:id/versions", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER","MEMBER"), upload.single("file"), DocumentsController.uploadVersion);
documentsRouter.delete("/:id", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), DocumentsController.removeDoc);
