import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { getCookieHeader } from "./helpers/cookies";

describe("OpenAPI docs and audit basics", () => {
  it("serves OpenAPI spec", async () => {
    const res = await request(app).get("/api/v1/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.paths?.["/health"]).toBeTruthy();
    expect(res.body.components?.securitySchemes?.cookieAuth).toBeTruthy();
  });

  it("serves Swagger UI HTML", async () => {
    const res = await request(app).get("/api/v1/docs");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("swagger-ui");
    expect(res.text).toContain("/api/v1/openapi.json");
  });

  it("allows admin to access audit list (if seeded admin exists)", async () => {
    const a = request(app);
    const login = await a
      .post("/api/v1/auth/login")
      .send({ email: "admin@teamalgebra.local", password: "Password123!" });
    if (login.status !== 200) return;
    const cookies = getCookieHeader(login);
    const audit = await a.get("/api/v1/audit").set("Cookie", cookies);
    expect(audit.status).toBe(200);
    expect(audit.body.success).toBe(true);
  });
});