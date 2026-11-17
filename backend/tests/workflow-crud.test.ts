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

describe("Workflow CRUD integration (admin)", () => {
  const created: { projectId?: string; taskId?: string; commentId?: string } = {};

  afterAll(async () => {
    // best-effort cleanup
    try { if (created.commentId) await prisma.taskComment.deleteMany({ where: { id: created.commentId } }); } catch {}
    try { if (created.taskId) await prisma.task.deleteMany({ where: { id: created.taskId } }); } catch {}
    try { if (created.projectId) await prisma.project.deleteMany({ where: { id: created.projectId } }); } catch {}
    await prisma.$disconnect();
  });

  it("creates project, task, comment and transitions task", async () => {
    const { agent, cookies } = await loginAdmin();
    const suffix = Date.now();

    const p = await agent
      .post("/api/v1/projects")
      .set("Cookie", cookies)
      .send({ name: `IT Project ${suffix}`, description: "integration test", status: "PLANNING" });
    expect(p.status).toBe(201);
    expect(p.body.success).toBe(true);
    created.projectId = p.body.data.id;

    const t = await agent
      .post("/api/v1/tasks")
      .set("Cookie", cookies)
      .send({ projectId: created.projectId, title: `IT Task ${suffix}`, status: "TODO", priority: "MEDIUM" });
    expect(t.status).toBe(201);
    created.taskId = t.body.data.id;

    const move = await agent
      .patch(`/api/v1/tasks/${created.taskId}/move`)
      .set("Cookie", cookies)
      .send({ status: "IN_PROGRESS" });
    expect(move.status).toBe(200);
    expect(move.body.data.status).toBe("IN_PROGRESS");

    const c = await agent
      .post("/api/v1/task-comments")
      .set("Cookie", cookies)
      .send({ taskId: created.taskId, content: "integration comment" });
    expect(c.status).toBe(201);
    created.commentId = c.body.data.id;

    const delC = await agent.delete(`/api/v1/task-comments/${created.commentId}`).set("Cookie", cookies);
    expect([200, 204]).toContain(delC.status);
    created.commentId = undefined;

    const delT = await agent.delete(`/api/v1/tasks/${created.taskId}`).set("Cookie", cookies);
    expect([200, 204]).toContain(delT.status);

    const delP = await agent.delete(`/api/v1/projects/${created.projectId}`).set("Cookie", cookies);
    expect([200, 204]).toContain(delP.status);
  });
});
