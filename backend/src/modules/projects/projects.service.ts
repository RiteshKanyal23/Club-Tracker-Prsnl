import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { ProjectsRepository } from "./projects.repository";

export const ProjectsService = {
  list: (query: any) => ProjectsRepository.list(query),
  async getById(id: string) {
    const p = await ProjectsRepository.getById(id);
    if (!p) throw new AppError("Project not found", 404);
    return p;
  },
  async create(payload: any, actorId?: string) {
    const project = await ProjectsRepository.create(payload);
    await ProjectsRepository.addHistory(project.id, actorId, "PROJECT_CREATED", { name: project.name, status: project.status });
    await auditLog({ actorId, action: "project.create", entityType: "Project", entityId: project.id, after: { name: project.name, status: project.status } });
    return project;
  },
  async update(id: string, payload: any, actorId?: string) {
    const before = await this.getById(id);
    const project = await ProjectsRepository.update(id, payload);
    await ProjectsRepository.addHistory(id, actorId, "PROJECT_UPDATED", { before: { name: before.name, status: before.status, deadline: before.deadline }, after: { name: project.name, status: project.status, deadline: project.deadline } });
    await auditLog({ actorId, action: "project.update", entityType: "Project", entityId: id, before: { name: before.name, status: before.status }, after: { name: project.name, status: project.status } });
    return project;
  },
  async remove(id: string, actorId?: string) {
    const before = await this.getById(id);
    const project = await ProjectsRepository.softDelete(id);
    await ProjectsRepository.addHistory(id, actorId, "PROJECT_DELETED", {});
    await auditLog({ actorId, action: "project.delete", entityType: "Project", entityId: id, before: { name: before.name, status: before.status } });
    return project;
  },
};
