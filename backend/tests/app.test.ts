import { describe, it, expect, vi } from "vitest";
import request from "supertest";

vi.mock("../src/config/database", () => ({
  prisma: { $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]) },
}));

import { app } from "../src/app";

describe("API health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.database).toBe("ok");
  });
});
