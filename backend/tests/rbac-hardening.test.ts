import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

async function loginAs(email: string) {
  const a = request(app);
  const login = await a.post("/api/v1/auth/login").send({ email, password: "Password123!" });
  expect(login.status).toBe(200);
  return { agent: a, cookies: login.headers["set-cookie"] || [] };
}

describe("RBAC hardening (negative cases)", () => {
  it("member cannot mutate tasks", async () => {
    const { agent, cookies } = await loginAs("member1@teamalgebra.local");
    const res = await agent
      .post("/api/v1/tasks")
      .set("Cookie", cookies)
      .send({ title: "RBAC test task", projectId: "00000000-0000-0000-0000-000000000000" });
    expect([401, 403, 422]).toContain(res.status);
    if (res.status !== 422) expect(res.status).toBe(403);
  });

  it("member cannot create knowledge articles", async () => {
    const { agent, cookies } = await loginAs("member1@teamalgebra.local");
    const res = await agent
      .post("/api/v1/knowledge")
      .set("Cookie", cookies)
      .send({ title: "Nope", content: "secret", tags: [] });
    expect(res.status).toBe(403);
  });

  it("member cannot create document folders", async () => {
    const { agent, cookies } = await loginAs("member1@teamalgebra.local");
    const res = await agent
      .post("/api/v1/documents/folders")
      .set("Cookie", cookies)
      .send({ name: "RBAC Folder" });
    expect(res.status).toBe(403);
  });
});
