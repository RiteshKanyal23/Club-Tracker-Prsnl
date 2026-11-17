import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { KnowledgeRepository } from "./knowledge.repository";
export const KnowledgeService = {
  list: (q:any)=>KnowledgeRepository.list(q),
  async getById(id:string){ const a=await KnowledgeRepository.getById(id); if(!a) throw new AppError("Article not found",404); return a; },
  async create(payload:any,userId?:string){ const a = await KnowledgeRepository.create(payload,userId); await auditLog({ actorId: userId, action: "knowledge.create", entityType: "KnowledgeArticle", entityId: a.id, after: { title: a.title } }); return a; },
  async update(id:string,payload:any, actorId?:string){ await this.getById(id); const a = await KnowledgeRepository.update(id,payload); await auditLog({ actorId, action: "knowledge.update", entityType: "KnowledgeArticle", entityId: id, after: { title: a.title } }); return a; },
  async remove(id:string, actorId?:string){ const before = await this.getById(id); const a = await KnowledgeRepository.remove(id); await auditLog({ actorId, action: "knowledge.delete", entityType: "KnowledgeArticle", entityId: id, before: { title: before.title } }); return a; },
};
