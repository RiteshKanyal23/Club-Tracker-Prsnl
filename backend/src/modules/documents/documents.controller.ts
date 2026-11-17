import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { DocumentsService } from "./documents.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { uploadDir } from "../../config/storage";

export const DocumentsController = {
  listFolders: asyncHandler(async (req: Request, res: Response) => ok(res, await DocumentsService.listFolders(req.query), "Folders")),
  createFolder: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await DocumentsService.createFolder(req.body, req.user?.id), "Folder created", 201)),
  getFolder: asyncHandler(async (req: Request, res: Response) => ok(res, await DocumentsService.getFolder(req.params.id), "Folder")),
  deleteFolder: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await DocumentsService.deleteFolder(req.params.id, req.user?.id), "Folder deleted")),
  listDocs: asyncHandler(async (req: Request, res: Response) => ok(res, await DocumentsService.listDocs(req.query), "Documents")),
  getDoc: asyncHandler(async (req: Request, res: Response) => ok(res, await DocumentsService.getDoc(req.params.id), "Document")),
  createDoc: asyncHandler(async (req: AuthRequest, res: Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;
    const payload = { ...req.body, accessRoles: typeof req.body.accessRoles === "string" ? JSON.parse(req.body.accessRoles || "[]") : (req.body.accessRoles || []) };
    const data = file ? await DocumentsService.createWithUpload(payload, file, req.user?.id) : await DocumentsService.createDoc(payload, req.user?.id);
    return ok(res, data, "Document created", 201);
  }),
  uploadVersion: asyncHandler(async (req: AuthRequest, res: Response) => {
    const file = (req as any).file as Express.Multer.File;
    const data = await DocumentsService.uploadVersion(req.params.id, file, req.user?.id);
    return ok(res, data, "Version uploaded", 201);
  }),
  removeDoc: asyncHandler(async (req: AuthRequest, res: Response) => ok(res, await DocumentsService.removeDoc(req.params.id, req.user?.id), "Document removed")),
  download: asyncHandler(async (req: Request, res: Response) => {
    const v = await DocumentsService.getDownload(req.query.versionId as string, req.query.documentId as string || req.params.id);
    const filePath = path.isAbsolute(v.path) ? v.path : path.join(uploadDir, path.basename(v.path));
    if (!fs.existsSync(filePath)) return res.status(404).json({ success:false, data:null, message:"File not found", errors:null });
    res.setHeader("Content-Type", v.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${v.originalName}"`);
    return fs.createReadStream(filePath).pipe(res);
  }),
  update: asyncHandler(async (_req: Request, res: Response) => ok(res, null, "Use version upload", 405)),
};
