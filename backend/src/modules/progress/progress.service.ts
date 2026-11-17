import { AppError } from "../../utils/AppError";
import { ProgressRepository } from "./progress.repository";

export const ProgressService = {
  async project(projectId: string) {
    if (!projectId) throw new AppError("projectId is required", 400);
    const { tasks, milestones } = await ProgressRepository.projectProgress(projectId);
    const total = tasks.length;
    const done = tasks.filter(t => t.status === "DONE").length;
    const byStatus = tasks.reduce((acc: any, t) => { acc[t.status] = (acc[t.status]||0)+1; return acc; }, {});
    const milestoneProgress = milestones.map(m => {
      const mt = m.tasks.length; const md = m.tasks.filter(t=>t.status==="DONE").length;
      return { id: m.id, title: m.title, dueDate: m.dueDate, total: mt, done: md, percent: mt ? Math.round(md/mt*100) : 0 };
    });
    // simple burndown: remaining tasks count over time buckets by due/creation not exact; provide daily remaining estimate for last 14 days
    const now = new Date();
    const burndown = Array.from({length: 14}).map((_,i)=>{
      const day = new Date(now.getTime() - (13-i)*24*60*60*1000);
      const dayEnd = new Date(day); dayEnd.setHours(23,59,59,999);
      const remaining = tasks.filter(t => !(t.status === "DONE")).length; // simplified snapshot
      return { date: dayEnd.toISOString().slice(0,10), remaining };
    });
    return { projectId, total, done, percent: total ? Math.round(done/total*100) : 0, byStatus, milestones: milestoneProgress, burndown };
  },
  async list(query: any) {
    if (query.projectId) return this.project(String(query.projectId));
    return { message: "Provide projectId query param for progress" };
  },
};
