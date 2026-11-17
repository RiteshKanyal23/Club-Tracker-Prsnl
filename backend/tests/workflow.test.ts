import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { getCookieHeader } from "./helpers/cookies";

describe("Workflow smoke (authenticated admin)", () => {
  it("can list analytics and notifications with auth", async () => {
    const a = request(app);
    const login = await a
      .post("/api/v1/auth/login")
      .send({ email: "admin@teamalgebra.local", password: "Password123!" });
    expect(login.status).toBe(200);
    const cookies = getCookieHeader(login);

    const overview = await a.get("/api/v1/analytics/overview").set("Cookie", cookies);
    expect(overview.status).toBe(200);
    expect(overview.body.success).toBe(true);

    const notifs = await a.get("/api/v1/notifications").set("Cookie", cookies);
    expect(notifs.status).toBe(200);
    expect(notifs.body.success).toBe(true);
  });
});