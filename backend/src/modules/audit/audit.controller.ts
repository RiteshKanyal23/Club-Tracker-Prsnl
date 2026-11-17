import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { AuditService } from "./audit.service";

export const AuditController = {
  list: asyncHandler(async (req: Request, res: Response) => ok(res, await AuditService.list(req.query), "Audit logs")),
  getById: asyncHandler(async (req: Request, res: Response) => ok(res, await AuditService.getById(req.params.id), "Audit log")),
  exportCsv: asyncHandler(async (req: Request, res: Response) => {
    const csv = await AuditService.exportCsv(req.query);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");
    return res.send(csv);
  }),
  create: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Not supported", 405)),
  update: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Not supported", 405)),
  remove: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Not supported", 405)),
};
