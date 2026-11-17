import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { AttendanceService } from "./attendance.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const AttendanceController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AttendanceService.list(req.query, req.user), "Attendance list")),
  getById: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AttendanceService.getById(req.params.id, req.user), "Attendance detail")),
  stats: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AttendanceService.stats(req.query, req.user), "Attendance stats")),
  create: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AttendanceService.create(req.body, req.user?.id, req.user), "Attendance created", 201)),
  capture: asyncHandler(async (req: AuthRequest, res: Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;
    const data = await AttendanceService.capture(req.body || {}, file, req.user?.id, req.user);
    return ok(res, data, "Attendance captured", 201);
  }),
  update: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AttendanceService.update(req.params.id, req.body, req.user?.id, req.user), "Attendance updated")),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AttendanceService.remove(req.params.id, req.user?.id, req.user), "Attendance removed")),
  checkIn: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AttendanceService.checkIn(req.body, req.user?.id, req.user), "Checked in", 201)),
  checkOut: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AttendanceService.checkOut(req.params.id, req.body, true, req.user?.id, req.user), "Checked out")),
  report: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await AttendanceService.report(req.query, req.user), "Attendance report")),
  exportCsv: asyncHandler(async (req: AuthRequest, res: Response) => {
    const csv = await AttendanceService.exportCsv(req.query, req.user);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=attendance-report.csv");
    return res.send(csv);
  }),
  photo: asyncHandler(async (req: AuthRequest, res: Response) => {
    const filePath = await AttendanceService.getPhotoPath(req.params.id, req.user);
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : "image/jpeg";
    res.setHeader("Content-Type", mime);
    res.setHeader("Cache-Control", "private, no-store");
    return fs.createReadStream(filePath).pipe(res);
  }),
};
