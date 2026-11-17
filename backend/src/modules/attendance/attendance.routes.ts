import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { upload } from "../../middleware/upload.middleware";
import { checkInSchema, checkOutSchema, createAttendanceSchema, updateAttendanceSchema } from "./attendance.validation";

export const attendanceRouter = Router();
attendanceRouter.use(authMiddleware);

attendanceRouter.get("/", validatePagination, AttendanceController.list);
attendanceRouter.get("/stats", AttendanceController.stats);
attendanceRouter.get("/report", AttendanceController.report);
attendanceRouter.get("/export/csv", AttendanceController.exportCsv);
attendanceRouter.post("/capture", requireRoles("ADMIN", "COORDINATOR", "TEAM_LEADER"), upload.single("photo"), AttendanceController.capture);

attendanceRouter.get("/:id/photo", AttendanceController.photo);
attendanceRouter.get("/:id", AttendanceController.getById);
attendanceRouter.post("/check-in", requireRoles("ADMIN", "COORDINATOR", "TEAM_LEADER"), validateBody(checkInSchema.shape.body), AttendanceController.checkIn);
attendanceRouter.post("/:id/check-out", requireRoles("ADMIN", "COORDINATOR", "TEAM_LEADER"), validateBody(checkOutSchema.shape.body), AttendanceController.checkOut);
attendanceRouter.post("/", requireRoles("ADMIN","COORDINATOR","TEAM_LEADER"), validateBody(createAttendanceSchema.shape.body), AttendanceController.create);
attendanceRouter.put("/:id", requireRoles("ADMIN","COORDINATOR","TEAM_LEADER"), validateBody(updateAttendanceSchema.shape.body), AttendanceController.update);
attendanceRouter.delete("/:id", requireRoles("ADMIN","COORDINATOR"), AttendanceController.remove);
