import { Router } from "express";
import { TaskCommentsController } from "./task-comments.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createCommentSchema, updateCommentSchema } from "./task-comments.validation";

export const taskCommentsRouter = Router();
taskCommentsRouter.use(authMiddleware);
taskCommentsRouter.get("/", validatePagination, TaskCommentsController.list);
taskCommentsRouter.get("/:id", TaskCommentsController.getById);
taskCommentsRouter.post("/", validateBody(createCommentSchema.shape.body), TaskCommentsController.create);
taskCommentsRouter.put("/:id", validateBody(updateCommentSchema.shape.body), TaskCommentsController.update);
taskCommentsRouter.delete("/:id", TaskCommentsController.remove);
