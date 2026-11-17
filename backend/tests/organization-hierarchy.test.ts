import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/database";
import { getCookieHeader } from "./helpers/cookies";

type Session = { agent: ReturnType<typeof request>; cookies: string[] };

const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const password = "Password123!";

async function login(email: string): Promise<Session> {
  const agent = request(app);
  const res = await agent.post("/api/v1/auth/login").send({ email, password });
  expect(res.status, `login failed for ${email}: ${res.body?.message}`).toBe(200);
  return { agent, cookies: getCookieHeader(res) };
}

const get = (s: Session, path: string) => s.agent.get(`/api/v1${path}`).set("Cookie", s.cookies);
const post = (s: Session, path: string, body: any) => s.agent.post(`/api/v1${path}`).set("Cookie", s.cookies).send(body);
const put = (s: Session, path: string, body: any) => s.agent.put(`/api/v1${path}`).set("Cookie", s.cookies).send(body);

describe("Lab member hierarchy, RBAC, and attendance snapshots", () => {
  let admin: Session;
  let ceo: Session;
  let pm: Session;
  let lead: Session;

  let projectSixId: string;
  let projectFiveId: string;
  let databaseTeamId: string;
  let frontendTeamId: string;
  let originalProjectSixManager: string | null = null;
  let originalDatabaseLeader: string | null = null;
  let originalDatabaseLeaderUserId: string | null = null;
  let originalFrontendLeader: string | null = null;
  let originalFrontendLeaderUserId: string | null = null;

  let created: any = {};
  const attendanceIds: string[] = [];
  const createdMemberIds: string[] = [];

  beforeAll(async () => {
    const projectSix = await prisma.project.findFirst({ where: { orgSlot: 6, deletedAt: null } });
    const projectFive = await prisma.project.findFirst({ where: { orgSlot: 5, deletedAt: null } });
    if (!projectSix || !projectFive) throw new Error("Organizational projects 5 and 6 are not seeded");
    projectSixId = projectSix.id;
    projectFiveId = projectFive.id;
    originalProjectSixManager = projectSix.managerId;

    const databaseTeam = await prisma.team.findFirst({ where: { projectId: projectSix.id, category: "DATABASE", deletedAt: null } });
    const frontendTeam = await prisma.team.findFirst({ where: { projectId: projectFive.id, category: "FRONTEND", deletedAt: null } });
    if (!databaseTeam || !frontendTeam) throw new Error("Organizational teams are not seeded");
    databaseTeamId = databaseTeam.id;
    frontendTeamId = frontendTeam.id;
    originalDatabaseLeader = databaseTeam.leaderMemberId;
    originalDatabaseLeaderUserId = databaseTeam.leaderId;
    originalFrontendLeader = frontendTeam.leaderMemberId;
    originalFrontendLeaderUserId = frontendTeam.leaderId;

    // The CEO slot is unique; clear any previous test CEO before registering this run's account.
    const existingCeos = await prisma.user.findMany({ where: { role: "CEO" }, select: { id: true } });
    for (const ceoUser of existingCeos) {
      const member = await prisma.member.findUnique({ where: { userId: ceoUser.id }, select: { id: true } });
      if (member) {
        await prisma.orgAssignment.updateMany({
          where: { memberId: member.id, status: "ACTIVE" },
          data: { status: "INACTIVE", activeKey: null, effectiveTo: new Date() },
        });
      }
      await prisma.user.update({ where: { id: ceoUser.id }, data: { role: "MEMBER", ceoSlot: null } });
    }

    await prisma.project.update({ where: { id: projectSixId }, data: { managerId: null } });
    await prisma.team.update({ where: { id: databaseTeamId }, data: { leaderMemberId: null, leaderId: null } });
    await prisma.team.update({ where: { id: frontendTeamId }, data: { leaderMemberId: null, leaderId: null } });

    admin = await login("admin@teamalgebra.local");

    const register = async (data: any) => {
      const res = await post(admin, "/organization/members", data);
      expect(res.status, `registration failed: ${res.body?.message}`).toBe(201);
      return res.body.data;
    };

    created.ceo = await register({
      name: `Test CEO ${suffix}`,
      email: `ceo-${suffix}@teamalgebra.local`,
      password,
      memberId: `CEO-${suffix}`,
      designationKey: "CEO",
      accountStatus: "ACTIVE",
    });
    created.pm = await register({
      name: `Test PM ${suffix}`,
      email: `pm-${suffix}@teamalgebra.local`,
      password,
      memberId: `PM-${suffix}`,
      designationKey: "PROJECT_MANAGER",
      projectId: projectSixId,
      accountStatus: "ACTIVE",
    });
    created.lead = await register({
      name: `Test Database Lead ${suffix}`,
      email: `dblead-${suffix}@teamalgebra.local`,
      password,
      memberId: `DBLEAD-${suffix}`,
      designationKey: "DATABASE_TEAM_LEAD",
      projectId: projectSixId,
      teamCategory: "DATABASE",
      accountStatus: "ACTIVE",
    });
    created.developer = await register({
      name: `Test Database Developer ${suffix}`,
      email: `dbdev-${suffix}@teamalgebra.local`,
      password,
      memberId: `DBDEV-${suffix}`,
      designationKey: "DATABASE_DEVELOPER",
      projectId: projectSixId,
      teamLeadId: created.lead.member.id,
      accountStatus: "ACTIVE",
    });
    created.frontendLead = await register({
      name: `Test Frontend Lead ${suffix}`,
      email: `flead-${suffix}@teamalgebra.local`,
      password,
      memberId: `FLEAD-${suffix}`,
      designationKey: "FRONTEND_TEAM_LEAD",
      projectId: projectFiveId,
      teamCategory: "FRONTEND",
      accountStatus: "ACTIVE",
    });

    [created.ceo, created.pm, created.lead, created.developer, created.frontendLead].forEach((item: any) => {
      if (item?.member?.id) createdMemberIds.push(item.member.id);
    });

    const unassignedUser = await prisma.user.create({
      data: {
        email: `unassigned-${suffix}@teamalgebra.local`,
        name: `Unassigned Member ${suffix}`,
        passwordHash: "not-used",
        role: "MEMBER",
        emailVerified: true,
      },
    });
    const unassignedMember = await prisma.member.create({
      data: { userId: unassignedUser.id, memberId: `UNASSIGNED-${suffix}` },
    });
    created.unassigned = unassignedMember;
    createdMemberIds.push(unassignedMember.id);

    ceo = await login(`ceo-${suffix}@teamalgebra.local`);
    pm = await login(`pm-${suffix}@teamalgebra.local`);
    lead = await login(`dblead-${suffix}@teamalgebra.local`);
  });

  afterAll(async () => {
    if (attendanceIds.length) {
      await prisma.attendanceRecord.deleteMany({ where: { id: { in: attendanceIds } } });
    }
    if (createdMemberIds.length) {
      await prisma.orgAssignment.updateMany({
        where: { memberId: { in: createdMemberIds }, status: "ACTIVE" },
        data: { status: "INACTIVE", activeKey: null, effectiveTo: new Date() },
      });
      await prisma.teamMember.deleteMany({ where: { memberId: { in: createdMemberIds } } });
    }
    await prisma.project.update({ where: { id: projectSixId }, data: { managerId: originalProjectSixManager } }).catch(() => {});
    await prisma.team.update({
      where: { id: databaseTeamId },
      data: { leaderMemberId: originalDatabaseLeader, leaderId: originalDatabaseLeaderUserId },
    }).catch(() => {});
    await prisma.team.update({
      where: { id: frontendTeamId },
      data: { leaderMemberId: originalFrontendLeader, leaderId: originalFrontendLeaderUserId },
    }).catch(() => {});
    if (created.ceo?.member?.userId) {
      await prisma.user.update({
        where: { id: created.ceo.member.userId },
        data: { role: "MEMBER", ceoSlot: null },
      }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("reports the fixed organization structure through validation", async () => {
    const res = await get(admin, "/organization/validation");
    expect(res.status).toBe(200);
    expect(res.body.data.counts.projects).toBe(6);
    expect(res.body.data.counts.teams).toBe(18);
    expect(Array.isArray(res.body.data.issues)).toBe(true);
  });

  it("blocks attendance for unassigned members instead of silently assigning them", async () => {
    const res = await post(admin, "/attendance", {
      memberId: created.unassigned.id,
      date: "2026-11-17T09:00:00.000Z",
      status: "PRESENT",
      sessionName: `Unassigned-${suffix}`,
    });
    expect(res.status).toBe(409);
    expect(String(res.body.message)).toMatch(/not registered|assignment/i);
  });

  it("scopes roster data to a project manager's project and a team lead's team", async () => {
    const pmRoster = await get(pm, "/organization/roster");
    expect(pmRoster.status).toBe(200);
    const pmRows = pmRoster.body.data.rows as any[];
    expect(pmRows.length).toBeGreaterThan(0);
    expect(pmRows.some((row) => row.designation === "Project Manager")).toBe(true);
    expect(pmRows.every((row) => row.project === "Project 6")).toBe(true);

    const leadRoster = await get(lead, "/organization/roster");
    expect(leadRoster.status).toBe(200);
    const leadRows = leadRoster.body.data.rows as any[];
    expect(leadRows.length).toBeGreaterThan(0);
    expect(leadRows.every((row) => row.project === "Project 6")).toBe(true);
    expect(leadRows.some((row) => row.team === "Database")).toBe(true);
    expect(leadRows.every((row) => row.team === "Database" || row.designation === "Project Manager")).toBe(true);
  });

  it("gives the CEO full read access but no attendance write access", async () => {
    const validation = await get(ceo, "/organization/validation");
    const roster = await get(ceo, "/organization/roster");
    expect(validation.status).toBe(200);
    expect(roster.status).toBe(200);
    expect((roster.body.data.rows as any[]).some((row) => row.project === "Project 6")).toBe(true);

    const write = await post(ceo, "/attendance", {
      memberId: created.developer.member.id,
      date: "2026-11-17T10:00:00.000Z",
      status: "PRESENT",
      sessionName: `CEO-readonly-${suffix}`,
    });
    expect(write.status).toBe(403);
  });

  it("stores role/project/team snapshots and keeps history unchanged after a transfer", async () => {
    const create = await post(admin, "/attendance", {
      memberId: created.developer.member.id,
      date: "2026-11-17T11:00:00.000Z",
      status: "PRESENT",
      sessionName: `Snapshot-${suffix}`,
      notes: "Hierarchy snapshot check",
    });
    expect(create.status, create.body?.message).toBe(201);
    const record = create.body.data;
    attendanceIds.push(record.id);

    expect(record.memberIdText).toBe(`DBDEV-${suffix}`);
    expect(record.memberName).toBe(`Test Database Developer ${suffix}`);
    expect(record.projectName).toBe("Project 6");
    expect(record.projectManagerName).toBe(`Test PM ${suffix}`);
    expect(record.teamName).toBe("Database");
    expect(record.teamLeadName).toBe(`Test Database Lead ${suffix}`);
    expect(record.designationName).toBe("Database Developer");

    const transfer = await put(admin, `/organization/members/${created.developer.member.id}`, {
      designationKey: "FRONTEND_DEVELOPER",
      teamLeadId: created.frontendLead.member.id,
      accountStatus: "ACTIVE",
    });
    expect(transfer.status, transfer.body?.message).toBe(200);
    expect(transfer.body.data.project.name).toBe("Project 5");
    expect(transfer.body.data.team.label).toBe("Frontend");

    const history = await get(admin, `/attendance/${record.id}`);
    expect(history.status).toBe(200);
    expect(history.body.data.projectName).toBe("Project 6");
    expect(history.body.data.teamName).toBe("Database");
    expect(history.body.data.teamLeadName).toBe(`Test Database Lead ${suffix}`);
    expect(history.body.data.designationName).toBe("Database Developer");
  });
});
