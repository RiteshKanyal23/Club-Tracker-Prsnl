import { Router } from "express";
import { KnowledgeController } from "./knowledge.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createArticleSchema, updateArticleSchema } from "./knowledge.validation";

export const knowledgeRouter = Router();
knowledgeRouter.use(authMiddleware);
knowledgeRouter.get("/", validatePagination, KnowledgeController.list);
knowledgeRouter.get("/:id", KnowledgeController.getById);
knowledgeRouter.post("/", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), validateBody(createArticleSchema.shape.body), KnowledgeController.create);
knowledgeRouter.put("/:id", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), validateBody(updateArticleSchema.shape.body), KnowledgeController.update);
knowledgeRouter.delete("/:id", requireRoles("ADMIN","COORDINATOR","PROJECT_MANAGER","TEAM_LEADER"), KnowledgeController.remove);
