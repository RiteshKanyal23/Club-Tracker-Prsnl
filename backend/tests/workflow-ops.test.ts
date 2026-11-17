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
  let leadMemberId: string | undefined;
  let teamId: string | undefined;
  const created: { attendanceId?: string; leaveId?: string } = {};

  beforeAll(async () => {
    const m = await prisma.member.findFirst({ where: { user: { role: "MEMBER" } } });
    if (!m) throw new Error("No seeded member found");
    memberId = m.id;

    // Attendance writes now require a complete hierarchy assignment.
    const project = await prisma.project.findFirst({ where: { orgSlot: 1 } });
    const team = project ? await prisma.team.findFirst({ where: { projectId: project.id, category: "FRONTEND" } }) : null;
    const leadDesignation = await prisma.designation.findUnique({ where: { key: "FRONTEND_TEAM_LEAD" } });
    const developerDesignation = await prisma.designation.findUnique({ where: { key: "FRONTEND_DEVELOPER" } });
    if (!project || !team || !leadDesignation || !developerDesignation) throw new Error("Organization structure not seeded");

    const leadUser = await prisma.user.findFirst({ where: { email: "lead1@teamalgebra.local" } });
    if (!leadUser) throw new Error("No seeded team lead found");
    let leadMember = await prisma.member.findUnique({ where: { userId: leadUser.id } });
    if (!leadMember) leadMember = await prisma.member.create({ data: { userId: leadUser.id, memberId: `TESTLEAD-${Date.now()}` } });
    leadMemberId = leadMember.id;
    teamId = team.id;

    await prisma.orgAssignment.updateMany({ where: { memberId: leadMember.id, status: "ACTIVE" }, data: { status: "INACTIVE", activeKey: null, effectiveTo: new Date() } });
    await prisma.orgAssignment.updateMany({ where: { memberId, status: "ACTIVE" }, data: { status: "INACTIVE", activeKey: null, effectiveTo: new Date() } });

    await prisma.user.update({ where: { id: leadUser.id }, data: { role: "TEAM_LEADER", isActive: true } });
    await prisma.member.update({ where: { id: leadMember.id }, data: { memberId: leadMember.memberId || `TESTLEAD-${Date.now()}`, status: "ACTIVE" } });
    await prisma.member.update({ where: { id: memberId }, data: { memberId: m.memberId || `TESTMEMBER-${Date.now()}`, status: "ACTIVE" } });
    await prisma.user.update({ where: { id: m.userId }, data: { isActive: true } });
    await prisma.team.update({ where: { id: team.id }, data: { leaderMemberId: leadMember.id, leaderId: leadUser.id } });

    await prisma.orgAssignment.create({ data: { memberId: leadMember.id, designationId: leadDesignation.id, projectId: project.id, teamId: team.id, status: "ACTIVE", activeKey: leadMember.id } });
    await prisma.orgAssignment.create({ data: { memberId, designationId: developerDesignation.id, projectId: project.id, teamId: team.id, teamLeadId: leadMember.id, status: "ACTIVE", activeKey: memberId } });
    await prisma.teamMember.upsert({ where: { teamId_memberId: { teamId: team.id, memberId: leadMember.id } }, update: {}, create: { teamId: team.id, memberId: leadMember.id } });
    await prisma.teamMember.upsert({ where: { teamId_memberId: { teamId: team.id, memberId } }, update: {}, create: { teamId: team.id, memberId } });
  });

  afterAll(async () => {
    try { if (created.leaveId) await prisma.leaveRequest.deleteMany({ where: { id: created.leaveId } }); } catch {}
    try { if (created.attendanceId) await prisma.attendanceRecord.deleteMany({ where: { id: created.attendanceId } }); } catch {}
    if (leadMemberId) {
      await prisma.orgAssignment.updateMany({ where: { memberId: leadMemberId, status: "ACTIVE" }, data: { status: "INACTIVE", activeKey: null, effectiveTo: new Date() } });
      await prisma.teamMember.deleteMany({ where: { memberId: leadMemberId } });
      await prisma.member.update({ where: { id: leadMemberId }, data: { memberId: null } }).catch(() => {});
    }
    if (teamId) await prisma.team.update({ where: { id: teamId }, data: { leaderMemberId: null, leaderId: null } }).catch(() => {});
    await prisma.orgAssignment.updateMany({ where: { memberId, status: "ACTIVE" }, data: { status: "INACTIVE", activeKey: null, effectiveTo: new Date() } });
    await prisma.teamMember.deleteMany({ where: { memberId } });
    await prisma.member.update({ where: { id: memberId }, data: { memberId: null } }).catch(() => {});
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
