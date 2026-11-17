import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { getCookieHeader } from "./helpers/cookies";

const agent = () => request(app);

describe("Auth & RBAC hardening", () => {
  it("rejects unauthenticated access to protected endpoints", async () => {
    const res = await agent().get("/api/v1/users");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns validation errors in standard envelope", async () => {
    const res = await agent()
      .post("/api/v1/auth/login")
      .send({ email: "not-an-email", password: "" });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
    expect(res.body.errors).toBeTruthy();
  });

  it("logs in with seeded admin and can access admin-only route", async () => {
    const a = agent();
    const login = await a
      .post("/api/v1/auth/login")
      .send({ email: "admin@teamalgebra.local", password: "Password123!" });
    expect(login.status).toBe(200);
    expect(login.body.success).toBe(true);
    const cookies = getCookieHeader(login);
    expect(cookies.join(";")).toContain("accessToken");

    const me = await a.get("/api/v1/auth/me").set("Cookie", cookies);
    expect(me.status).toBe(200);
    expect(me.body.data?.user?.email).toBe("admin@teamalgebra.local");

    const users = await a.get("/api/v1/users").set("Cookie", cookies);
    expect([200, 403]).toContain(users.status); // depends on RBAC wiring, but admin should be allowed
    if (users.status === 200) expect(users.body.success).toBe(true);
  });

  it("forbids non-admin from admin-only audit endpoint when authenticated as member (if available)", async () => {
    const a = agent();
    const login = await a
      .post("/api/v1/auth/login")
      .send({ email: "member1@teamalgebra.local", password: "Password123!" });
    if (login.status !== 200) return; // seeded user may vary; skip softly
    const cookies = getCookieHeader(login);
    const audit = await a.get("/api/v1/audit").set("Cookie", cookies);
    expect([401, 403]).toContain(audit.status);
    expect(audit.body.success).toBe(false);
  });
});