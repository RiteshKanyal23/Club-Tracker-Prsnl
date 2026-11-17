import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Pagination validation", () => {
  it("rejects invalid pagination params on list endpoints", async () => {
    const a = request(app);
    const login = await a
      .post("/api/v1/auth/login")
      .send({ email: "admin@teamalgebra.local", password: "Password123!" });
    expect(login.status).toBe(200);
    const cookies = login.headers["set-cookie"] || [];

    const res = await a
      .get("/api/v1/projects?page=0&limit=9999")
      .set("Cookie", cookies);
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
  });
});