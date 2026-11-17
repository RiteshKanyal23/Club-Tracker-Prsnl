import { prisma } from "../../config/database";

export const DocumentsRepository = {
  listFolders(query:any){ return prisma.documentFolder.findMany({ where: { ...(query.parentId ? { parentId: String(query.parentId) } : {}), ...(query.projectId ? { projectId: String(query.projectId) } : {}), ...(query.teamId ? { teamId: String(query.teamId) } : {}) }, include: { children: true, documents: true }, orderBy: { name: "asc" } }); },
  createFolder(data:any, userId?:string){ return prisma.documentFolder.create({ data: { ...data, createdBy: userId } }); },
  getFolder(id:string){ return prisma.documentFolder.findUnique({ where: { id }, include: { documents: { include: { versions: { orderBy: { version: "desc" } } } }, children: true } }); },
  deleteFolder(id:string){ return prisma.documentFolder.delete({ where: { id } }); },
  listDocs(query:any){ return prisma.document.findMany({ where: { deletedAt: null, ...(query.folderId ? { folderId: String(query.folderId) } : {}), ...(query.projectId ? { projectId: String(query.projectId) } : {}), ...(query.teamId ? { teamId: String(query.teamId) } : {}) }, include: { versions: { orderBy: { version: "desc" } }, folder: true }, orderBy: { updatedAt: "desc" } }); },
  getDoc(id:string){ return prisma.document.findFirst({ where: { id, deletedAt: null }, include: { versions: { orderBy: { version: "desc" } }, folder: true } }); },
  createDoc(data:any, userId?:string){ return prisma.document.create({ data: { ...data, createdBy: userId, accessRoles: data.accessRoles || [] } }); },
  softDeleteDoc(id:string){ return prisma.document.update({ where: { id }, data: { deletedAt: new Date() } }); },
  async addVersion(documentId:string, file: any, userId?:string){
    const latest = await prisma.documentVersion.findFirst({ where: { documentId }, orderBy: { version: "desc" } });
    const version = (latest?.version || 0) + 1;
    return prisma.documentVersion.create({ data: { documentId, version, filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, path: file.path || file.filename, uploadedBy: userId } });
  },
  getVersion(id:string){ return prisma.documentVersion.findUnique({ where: { id }, include: { document: true } }); },
};
