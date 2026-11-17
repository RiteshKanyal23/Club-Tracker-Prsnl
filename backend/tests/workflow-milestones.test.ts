import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { getCookieHeader } from "./helpers/cookies";
import { prisma } from "../src/config/database";

async function loginAdmin() {
  const a = request(app);
  const login = await a.post("/api/v1/auth/login").send({ email: "admin@teamalgebra.local", password: "Password123!" });
  expect(login.status).toBe(200);
  return { agent: a, cookies: getCookieHeader(login) };
}

describe("Workflow milestones & progress", () => {
  const created: { projectId?: string; milestoneId?: string; taskId?: string } = {};

  afterAll(async () => {
    try { if (created.taskId) await prisma.task.deleteMany({ where: { id: created.taskId } }); } catch {}
    try { if (created.milestoneId) await prisma.milestone.deleteMany({ where: { id: created.milestoneId } }); } catch {}
    try { if (created.projectId) await prisma.project.deleteMany({ where: { id: created.projectId } }); } catch {}
    await prisma.$disconnect();
  });

  it("creates project/milestone/task and reads progress", async () => {
    const { agent, cookies } = await loginAdmin();
    const suffix = Date.now();

    const project = await agent.post("/api/v1/projects").set("Cookie", cookies).send({ name: `MSProj ${suffix}` });
    expect(project.status).toBe(201);
    created.projectId = project.body.data.id;

    const milestone = await agent.post("/api/v1/milestones").set("Cookie", cookies).send({
      projectId: created.projectId,
      title: `Milestone ${suffix}`,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(milestone.status).toBe(201);
    created.milestoneId = milestone.body.data.id;

    const task = await agent.post("/api/v1/tasks").set("Cookie", cookies).send({
      projectId: created.projectId,
      milestoneId: created.milestoneId,
      title: `MS Task ${suffix}`,
      status: "TODO",
    });
    expect(task.status).toBe(201);
    created.taskId = task.body.data.id;

    const moved = await agent.patch(`/api/v1/tasks/${created.taskId}/move`).set("Cookie", cookies).send({ status: "DONE" });
    expect(moved.status).toBe(200);

    const progress = await agent.get(`/api/v1/progress/${created.projectId}`).set("Cookie", cookies);
    expect(progress.status).toBe(200);
    expect(progress.body.success).toBe(true);
    expect(progress.body.data).toBeTruthy();
  });
});
