import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/database";

async function loginAdmin() {
  const a = request(app);
  const login = await a.post("/api/v1/auth/login").send({ email: "admin@teamalgebra.local", password: "Password123!" });
  expect(login.status).toBe(200);
  return { agent: a, cookies: login.headers["set-cookie"] || [] };
}

describe("Workflow meetings/minutes/action-items", () => {
  const created: { projectId?: string; meetingId?: string; minutesId?: string; actionItemId?: string; taskId?: string } = {};

  afterAll(async () => {
    try { if (created.taskId) await prisma.task.deleteMany({ where: { id: created.taskId } }); } catch {}
    try { if (created.actionItemId) await prisma.actionItem.deleteMany({ where: { id: created.actionItemId } }); } catch {}
    try { if (created.minutesId) await prisma.meetingMinutes.deleteMany({ where: { id: created.minutesId } }); } catch {}
    try { if (created.meetingId) await prisma.meeting.deleteMany({ where: { id: created.meetingId } }); } catch {}
    try { if (created.projectId) await prisma.project.deleteMany({ where: { id: created.projectId } }); } catch {}
    await prisma.$disconnect();
  });

  it("creates meeting, minutes, action item and converts to task", async () => {
    const { agent, cookies } = await loginAdmin();
    const suffix = Date.now();

    const project = await agent.post("/api/v1/projects").set("Cookie", cookies).send({ name: `MeetProj ${suffix}` });
    expect(project.status).toBe(201);
    created.projectId = project.body.data.id;

    const meeting = await agent.post("/api/v1/meetings").set("Cookie", cookies).send({
      title: `Meeting ${suffix}`,
      agenda: "Integration flow",
      scheduledAt: new Date().toISOString(),
      projectId: created.projectId,
    });
    expect(meeting.status).toBe(201);
    created.meetingId = meeting.body.data.id;

    const minutes = await agent.post("/api/v1/meeting-minutes").set("Cookie", cookies).send({
      meetingId: created.meetingId,
      content: "Discussed action items and next steps.",
    });
    expect([200, 201]).toContain(minutes.status);
    expect(minutes.body.success).toBe(true);
    created.minutesId = minutes.body.data.id;

    const action = await agent.post("/api/v1/action-items").set("Cookie", cookies).send({
      meetingId: created.meetingId,
      title: `Action ${suffix}`,
      description: "Convert to task",
    });
    expect(action.status).toBe(201);
    created.actionItemId = action.body.data.id;

    const converted = await agent
      .post(`/api/v1/action-items/${created.actionItemId}/convert-to-task`)
      .set("Cookie", cookies)
      .send({ projectId: created.projectId });
    expect([200, 201]).toContain(converted.status);
    expect(converted.body.success).toBe(true);
    // try to capture created task id from response shapes
    const task = converted.body.data?.task || converted.body.data;
    if (task?.id) created.taskId = task.id;
    if (!created.taskId) {
      // fallback: find a task by title in project
      const t = await prisma.task.findFirst({ where: { projectId: created.projectId, title: `Action ${suffix}` } });
      if (t) created.taskId = t.id;
    }
    expect(created.taskId).toBeTruthy();
  });
});
