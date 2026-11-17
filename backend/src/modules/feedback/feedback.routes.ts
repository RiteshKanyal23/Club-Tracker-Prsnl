import { Router } from "express";
import { FeedbackController } from "./feedback.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createFeedbackSchema, updateFeedbackSchema } from "./feedback.validation";

export const feedbackRouter = Router();
feedbackRouter.use(authMiddleware);

feedbackRouter.get("/", validatePagination, FeedbackController.list);
feedbackRouter.get("/:id", FeedbackController.getById);
feedbackRouter.post("/", validateBody(createFeedbackSchema.shape.body), FeedbackController.create);
feedbackRouter.put("/:id", validateBody(updateFeedbackSchema.shape.body), FeedbackController.update);
feedbackRouter.delete("/:id", FeedbackController.remove);
