import { AppError } from "../../utils/AppError";
import { ProjectHistoryRepository } from "./project-history.repository";

export const ProjectHistoryService = {
  list: (projectId?: string) => ProjectHistoryRepository.list(projectId),
  async getById(id: string) {
    const item = await ProjectHistoryRepository.getById(id);
    if (!item) throw new AppError("History entry not found", 404);
    return item;
  },
};
