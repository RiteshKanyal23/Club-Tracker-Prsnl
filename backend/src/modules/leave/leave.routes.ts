import { Router } from "express";
import { LeaveController } from "./leave.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { applyLeaveSchema, reviewLeaveSchema, setBalanceSchema } from "./leave.validation";

export const leaveRouter = Router();
leaveRouter.use(authMiddleware);
leaveRouter.get("/", validatePagination, LeaveController.list);
leaveRouter.get("/calendar", LeaveController.calendar);
leaveRouter.get("/balance", LeaveController.balance);
leaveRouter.post("/balance", requireRoles("ADMIN","COORDINATOR"), validateBody(setBalanceSchema.shape.body), LeaveController.setBalance);
leaveRouter.get("/:id", LeaveController.getById);
leaveRouter.post("/", validateBody(applyLeaveSchema.shape.body), LeaveController.create);
leaveRouter.post("/:id/review", requireRoles("ADMIN","COORDINATOR","TEAM_LEADER"), validateBody(reviewLeaveSchema.shape.body), LeaveController.review);
leaveRouter.delete("/:id", requireRoles("ADMIN","COORDINATOR"), LeaveController.remove);
