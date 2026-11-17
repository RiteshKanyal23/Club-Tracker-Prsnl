import { describe, it, expect, afterAll, beforeAll } from "vitest";
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

describe("Workflow ops integration (attendance & leave)", () => {
  let memberId: string;
  const created: { attendanceId?: string; leaveId?: string } = {};

  beforeAll(async () => {
    const m = await prisma.member.findFirst();
    if (!m) throw new Error("No seeded member found");
    memberId = m.id;
  });

  afterAll(async () => {
    try { if (created.leaveId) await prisma.leaveRequest.deleteMany({ where: { id: created.leaveId } }); } catch {}
    try { if (created.attendanceId) await prisma.attendanceRecord.deleteMany({ where: { id: created.attendanceId } }); } catch {}
    await prisma.$disconnect();
  });

  it("handles attendance check-in/check-out", async () => {
    const { agent, cookies } = await loginAdmin();
    const checkIn = await agent
      .post("/api/v1/attendance/check-in")
      .set("Cookie", cookies)
      .send({ memberId, sessionName: `IT Session ${Date.now()}` });
    expect([200, 201]).toContain(checkIn.status);
    expect(checkIn.body.success).toBe(true);
    created.attendanceId = checkIn.body.data.id;

    const checkOut = await agent
      .post(`/api/v1/attendance/${created.attendanceId}/check-out`)
      .set("Cookie", cookies)
      .send({});
    expect(checkOut.status).toBe(200);
    expect(checkOut.body.success).toBe(true);
  });

  it("handles leave apply and review", async () => {
    const { agent, cookies } = await loginAdmin();
    const start = new Date();
    const end = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const apply = await agent
      .post("/api/v1/leave")
      .set("Cookie", cookies)
      .send({ memberId, startDate: start.toISOString(), endDate: end.toISOString(), reason: "Integration test leave" });
    expect(apply.status).toBe(201);
    expect(apply.body.success).toBe(true);
    created.leaveId = apply.body.data.id;

    const review = await agent
      .post(`/api/v1/leave/${created.leaveId}/review`)
      .set("Cookie", cookies)
      .send({ status: "APPROVED", remarks: "ok" });
    expect(review.status).toBe(200);
    expect(review.body.data.status).toBe("APPROVED");
  });
});
