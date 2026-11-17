import { Router } from "express";
import { AnalyticsController } from "./analytics.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";

export const analyticsRouter = Router();
analyticsRouter.use(authMiddleware);

analyticsRouter.get("/overview", AnalyticsController.overview);
analyticsRouter.get("/workload", AnalyticsController.workload);
analyticsRouter.get("/trends", AnalyticsController.trends);
analyticsRouter.get("/", validatePagination, AnalyticsController.list);
