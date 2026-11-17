import { Router } from "express";
import { AchievementsController } from "./achievements.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createAchievementSchema, updateAchievementSchema, awardAchievementSchema } from "./achievements.validation";

export const achievementsRouter = Router();
achievementsRouter.use(authMiddleware);

achievementsRouter.get("/", validatePagination, AchievementsController.list);
achievementsRouter.get("/awards", AchievementsController.listAwards);
achievementsRouter.post("/award", requireRoles("ADMIN", "COORDINATOR", "TEAM_LEADER"), validateBody(awardAchievementSchema.shape.body), AchievementsController.award);
achievementsRouter.post("/evaluate", requireRoles("ADMIN", "COORDINATOR", "TEAM_LEADER"), AchievementsController.evaluate);
achievementsRouter.get("/:id", AchievementsController.getById);
achievementsRouter.post("/", requireRoles("ADMIN", "COORDINATOR"), validateBody(createAchievementSchema.shape.body), AchievementsController.create);
achievementsRouter.put("/:id", requireRoles("ADMIN", "COORDINATOR"), validateBody(updateAchievementSchema.shape.body), AchievementsController.update);
achievementsRouter.delete("/:id", requireRoles("ADMIN", "COORDINATOR"), AchievementsController.remove);
