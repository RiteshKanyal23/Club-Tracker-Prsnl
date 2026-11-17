import { prisma } from "../../config/database";
export const KnowledgeRepository = {
  list(query:any){
    const where:any = {};
    if (query.search) where.OR = [{ title: { contains: String(query.search), mode: "insensitive" } }, { content: { contains: String(query.search), mode: "insensitive" } }];
    if (query.category) where.category = String(query.category);
    if (query.tag) where.tags = { has: String(query.tag) };
    if (query.published) where.published = query.published === "true";
    return prisma.knowledgeArticle.findMany({ where, include: { author: { select: { id:true,name:true,email:true } } }, orderBy: { updatedAt: "desc" } });
  },
  getById(id:string){ return prisma.knowledgeArticle.findUnique({ where: { id }, include: { author: { select: { id:true,name:true,email:true } } } }); },
  create(data:any, authorId?:string){ return prisma.knowledgeArticle.create({ data: { ...data, authorId, tags: data.tags||[] } }); },
  update(id:string,data:any){ return prisma.knowledgeArticle.update({ where: { id }, data }); },
  remove(id:string){ return prisma.knowledgeArticle.delete({ where: { id } }); },
};
