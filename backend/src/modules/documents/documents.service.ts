import path from "path";
import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { DocumentsRepository } from "./documents.repository";

export const DocumentsService = {
  listFolders: (q:any)=>DocumentsRepository.listFolders(q),
  async createFolder(payload:any, userId?:string){ const f = await DocumentsRepository.createFolder(payload, userId); await auditLog({ actorId: userId, action: "document.folder_create", entityType: "DocumentFolder", entityId: f.id, after: { name: f.name } }); return f; },
  async getFolder(id:string){ const f=await DocumentsRepository.getFolder(id); if(!f) throw new AppError("Folder not found",404); return f; },
  async deleteFolder(id:string, actorId?:string){ const before = await this.getFolder(id); const f = await DocumentsRepository.deleteFolder(id); await auditLog({ actorId, action: "document.folder_delete", entityType: "DocumentFolder", entityId: id, before: { name: before.name } }); return f; },
  listDocs: (q:any)=>DocumentsRepository.listDocs(q),
  async getDoc(id:string){ const d=await DocumentsRepository.getDoc(id); if(!d) throw new AppError("Document not found",404); return d; },
  async createDoc(payload:any, userId?:string){ const d = await DocumentsRepository.createDoc(payload, userId); await auditLog({ actorId: userId, action: "document.create", entityType: "Document", entityId: d.id, after: { title: d.title } }); return d; },
  async uploadVersion(documentId:string, file: Express.Multer.File, userId?:string){
    if(!file) throw new AppError("File is required",400);
    await this.getDoc(documentId);
    const v = await DocumentsRepository.addVersion(documentId, file, userId);
    await auditLog({ actorId: userId, action: "document.version_upload", entityType: "Document", entityId: documentId, after: { version: v.version, filename: v.originalName } });
    return v;
  },
  async createWithUpload(payload:any, file: Express.Multer.File, userId?:string){
    if(!file) throw new AppError("File is required",400);
    const doc = await DocumentsRepository.createDoc(payload, userId);
    await auditLog({ actorId: userId, action: "document.create", entityType: "Document", entityId: doc.id, after: { title: doc.title } });
    await DocumentsRepository.addVersion(doc.id, file, userId);
    return this.getDoc(doc.id);
  },
  async removeDoc(id:string, actorId?:string){ const before = await this.getDoc(id); const d = await DocumentsRepository.softDeleteDoc(id); await auditLog({ actorId, action: "document.delete", entityType: "Document", entityId: id, before: { title: before.title } }); return d; },
  async getDownload(versionId?:string, documentId?:string){
    if (versionId) {
      const v = await DocumentsRepository.getVersion(versionId);
      if (!v) throw new AppError("Version not found",404);
      return v;
    }
    if (documentId) {
      const d = await this.getDoc(documentId);
      const v = d.versions?.[0];
      if (!v) throw new AppError("No file version found",404);
      return v;
    }
    throw new AppError("versionId or documentId required",400);
  },
};
