import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { auditLog } from "../../services/audit.service";
import { hashPassword } from "../../utils/auth";
import {
  assignmentInclude,
  assertManage,
  assertProjectAccess,
  assertTeamAccess,
  CATEGORY_LABEL,
  DEVELOPER_DESIGNATION_KEY,
  formatAssignment,
  getActiveAssignment,
  OrgScope,
  resolveOrgScope,
  ReqUser,
  TEAM_LEAD_DESIGNATION_KEY,
  validateAssignment,
} from "./organization.scope";

const TEAM_CATEGORIES = ["FRONTEND", "BACKEND", "DATABASE"];

function isLeadKey(key: string) {
  return key.endsWith("_TEAM_LEAD");
}

function isDeveloperKey(key: string) {
  return key.endsWith("_DEVELOPER");
}

function categoryFromKey(key: string) {
  const category = key.split("_")[0]?.toUpperCase();
  return category && TEAM_CATEGORIES.includes(category) ? category : null;
}

function roleForDesignation(key: string, requested?: string) {
  if (key === "CEO") return "CEO";
  if (key === "PROJECT_MANAGER") return "PROJECT_MANAGER";
  if (isLeadKey(key)) return "TEAM_LEADER";
  if (isDeveloperKey(key)) return "MEMBER";
  if (requested && ["ADMIN", "COORDINATOR", "PROJECT_MANAGER", "TEAM_LEADER", "MEMBER"].includes(requested)) return requested;
  return "MEMBER";
}

async function designationByRef(tx: any, payload: any) {
  if (payload.designationId) {
    const designation = await tx.designation.findUnique({ where: { id: String(payload.designationId) } });
    if (!designation) throw new AppError("Designation not found", 404);
    return designation;
  }
  const key = payload.designationKey || payload.designation;
  if (key) {
    const designation = await tx.designation.findUnique({ where: { key: String(key) } });
    if (!designation) throw new AppError("Designation not found", 404);
    return designation;
  }
  throw new AppError("Designation is required", 400);
}

async function closeActiveAssignment(tx: any, memberId: string) {
  await tx.orgAssignment.updateMany({
    where: { memberId, status: "ACTIVE" },
    data: { status: "INACTIVE", activeKey: null, effectiveTo: new Date() },
  });
}

async function clearManagementLinks(tx: any, userId: string, memberId: string) {
  await tx.project.updateMany({ where: { managerId: userId }, data: { managerId: null } });
  await tx.team.updateMany({ where: { leaderMemberId: memberId }, data: { leaderMemberId: null, leaderId: null } });
}

async function demotePreviousManagement(tx: any, options: { userId: string; memberId: string; ceo?: boolean; project?: boolean; lead?: boolean }) {
  const { userId, memberId } = options;
  if (options.ceo) {
    const otherCeo = await tx.user.findFirst({ where: { ceoSlot: "CEO", id: { not: userId } } });
    if (otherCeo) {
      const otherMember = await tx.member.findUnique({ where: { userId: otherCeo.id } });
      await closeActiveAssignment(tx, otherMember!.id);
      await tx.user.update({ where: { id: otherCeo.id }, data: { role: "MEMBER", ceoSlot: null } });
    }
  }
  if (options.project) {
    const managedProjects = await tx.project.findMany({ where: { managerId: userId }, select: { id: true } });
    if (managedProjects.length) {
      await tx.project.updateMany({
        where: { id: { in: managedProjects.map((p: any) => p.id) } },
        data: { managerId: null },
      });
      const otherMember = await tx.member.findUnique({ where: { userId }, select: { id: true } });
      if (otherMember) {
        const pmAssignment = await tx.orgAssignment.findFirst({
          where: { memberId: otherMember.id, status: "ACTIVE", designation: { key: "PROJECT_MANAGER" } },
        });
        if (pmAssignment) await closeActiveAssignment(tx, otherMember.id);
      }
    }
  }
  if (options.lead) {
    const ledTeams = await tx.team.findMany({ where: { leaderMemberId: memberId } });
    if (ledTeams.length) {
      await tx.team.updateMany({ where: { leaderMemberId: memberId }, data: { leaderMemberId: null, leaderId: null } });
    }
  }
}

async function resolveAssignmentContext(tx: any, payload: any, designation: any, userId: string, memberId: string) {
  const key = String(designation.key);
  const result: any = {
    projectId: null as string | null,
    teamId: null as string | null,
    teamLeadId: null as string | null,
    projectManagerId: null as string | null,
    team: null as any,
    project: null as any,
  };
  if (key === "CEO") return result;

  const projectId = payload.projectId ? String(payload.projectId) : null;
  if (key === "PROJECT_MANAGER") {
    if (!projectId) throw new AppError("Assigned project is required for a Project Manager", 400);
    const project = await tx.project.findFirst({ where: { id: projectId, orgSlot: { not: null }, deletedAt: null } });
    if (!project) throw new AppError("Organizational project not found", 404);
    if (project.managerId && project.managerId !== userId) throw new AppError("Another Project Manager is already assigned to this project", 409);
    return { ...result, projectId, projectManagerId: userId, project };
  }

  const requestedCategory = payload.teamCategory ? String(payload.teamCategory).trim().toUpperCase() : null;
  const category = requestedCategory ?? categoryFromKey(key);
  if (isLeadKey(key)) {
    if (!projectId) throw new AppError("Assigned project is required for a Team Lead", 400);
    if (!category || !TEAM_CATEGORIES.includes(category)) throw new AppError("Valid team category is required", 400);
    const expectedKey = TEAM_LEAD_DESIGNATION_KEY[category];
    if (key !== expectedKey) throw new AppError("Designation does not match the team category", 400);
    const project = await tx.project.findFirst({ where: { id: projectId, orgSlot: { not: null }, deletedAt: null } });
    if (!project) throw new AppError("Organizational project not found", 404);
    const team = await tx.team.findFirst({ where: { projectId, category: category as any, deletedAt: null } });
    if (!team) throw new AppError("Team not found for this project and category", 404);
    if (team.leaderMemberId && team.leaderMemberId !== memberId) {
      throw new AppError("Another Team Lead is already assigned to this team", 409);
    }
    return { ...result, projectId, teamId: team.id, projectManagerId: project.managerId, team, project };
  }

  const teamLeadId = payload.teamLeadId ? String(payload.teamLeadId) : null;
  if (teamLeadId) {
    const lead = await tx.member.findUnique({
      where: { id: teamLeadId },
      include: {
        user: { select: { id: true, name: true } },
        orgAssignments: {
          where: { status: "ACTIVE" },
          include: { designation: true, team: true, project: { include: { manager: true } } },
        },
      },
    });
    if (!lead) throw new AppError("Assigned Team Lead not found", 404);
    const leadAssignment = lead.orgAssignments[0];
    if (!leadAssignment || !isLeadKey(leadAssignment.designation.key)) {
      throw new AppError("Assigned member is not an active Team Lead", 400);
    }
    const leadCategory = leadAssignment.team?.category ? String(leadAssignment.team.category) : "";
    if (!leadAssignment.teamId || !leadAssignment.projectId) {
      throw new AppError("Assigned Team Lead has an incomplete assignment", 409);
    }
    if (isDeveloperKey(key) && leadCategory && DEVELOPER_DESIGNATION_KEY[leadCategory] !== key) {
      throw new AppError("Designation does not match the Team Lead's team category", 400);
    }
    if (category && leadCategory && category !== leadCategory) {
      throw new AppError("Team category does not match the Team Lead's team", 400);
    }
    return {
      ...result,
      projectId: leadAssignment.projectId,
      teamId: leadAssignment.teamId,
      teamLeadId,
      projectManagerId: leadAssignment.project?.managerId ?? null,
      team: leadAssignment.team,
      project: leadAssignment.project,
    };
  }

  if (!projectId) throw new AppError("Assigned project or Team Lead is required", 400);
  const project = await tx.project.findFirst({ where: { id: projectId, orgSlot: { not: null }, deletedAt: null } });
  if (!project) throw new AppError("Organizational project not found", 404);
  let team = null;
  if (teamIdFromPayload(payload) || category) {
    team = await tx.team.findFirst({
      where: { id: teamIdFromPayload(payload) || undefined, projectId, category: (category || undefined) as any, deletedAt: null },
    });
    if (!team) throw new AppError("Team not found for this project and category", 404);
  }
  return { ...result, projectId, teamId: team?.id ?? null, projectManagerId: project.managerId, team, project };
}

function teamIdFromPayload(payload: any) {
  return payload.teamId ? String(payload.teamId) : null;
}

async function syncTeamMembership(tx: any, memberId: string, teamId: string | null) {
  if (teamId) {
    await tx.teamMember.upsert({
      where: { teamId_memberId: { teamId, memberId } },
      update: {},
      create: { teamId, memberId },
    });
  }
  await tx.teamMember.deleteMany({ where: { memberId, ...(teamId ? { teamId: { not: teamId } } : {}) } });
}

async function syncUserRoleLink(tx: any, userId: string, role: string) {
  const roleRow = await tx.role.findUnique({ where: { name: role as any } });
  if (!roleRow) return;
  await tx.userRole.upsert({
    where: { userId_roleId: { userId, roleId: roleRow.id } },
    update: {},
    create: { userId, roleId: roleRow.id },
  });
}

async function createAssignment(tx: any, data: {
  memberId: string;
  designationId: string;
  projectId: string | null;
  teamId: string | null;
  teamLeadId: string | null;
  projectManagerId: string | null;
}) {
  return tx.orgAssignment.create({
    data: {
      memberId: data.memberId,
      designationId: data.designationId,
      projectId: data.projectId,
      teamId: data.teamId,
      teamLeadId: data.teamLeadId,
      projectManagerId: data.projectManagerId,
      status: "ACTIVE",
      activeKey: data.memberId,
      effectiveFrom: new Date(),
    },
    include: assignmentInclude,
  });
}

export const OrganizationService = {
  async registerMember(payload: any, actorId?: string) {
    const result = await prisma.$transaction(async (tx: any) => {
      const name = String(payload.name || "").trim();
      const email = String(payload.email || "").trim().toLowerCase();
      const memberId = String(payload.memberId || "").trim();
      const password = String(payload.password || "");
      if (!name || !email || !memberId) throw new AppError("Full name, email, and Member ID are required", 400);
      if (password.length < 8) throw new AppError("Password must be at least 8 characters", 400);

      if (await tx.user.findUnique({ where: { email } })) throw new AppError("Email already registered", 409);
      if (await tx.member.findUnique({ where: { memberId } })) throw new AppError("Member ID already registered", 409);

      const designation = await designationByRef(tx, payload);
      const key = String(designation.key);
      const role = roleForDesignation(key, payload.role);
      const accountStatus = payload.accountStatus === "INACTIVE" || payload.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

      if (key === "CEO") {
        const existingCeo = await tx.user.findFirst({ where: { ceoSlot: "CEO" } });
        if (existingCeo) throw new AppError("Exactly one CEO is allowed", 409);
      }

      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash: await hashPassword(password),
          role: role as any,
          isActive: accountStatus === "ACTIVE",
          emailVerified: true,
          ceoSlot: key === "CEO" ? "CEO" : null,
        },
      });
      const member = await tx.member.create({
        data: {
          userId: user.id,
          memberId,
          phone: payload.phone || payload.contactNumber || null,
          profilePicture: payload.profilePicture || null,
          joiningDate: payload.joiningDate ? new Date(payload.joiningDate) : new Date(),
          status: accountStatus as any,
        },
      });
      await syncUserRoleLink(tx, user.id, role);

      const context = await resolveAssignmentContext(tx, payload, designation, user.id, member.id);
      const assignment = await createAssignment(tx, {
        memberId: member.id,
        designationId: designation.id,
        projectId: context.projectId,
        teamId: context.teamId,
        teamLeadId: context.teamLeadId,
        projectManagerId: context.projectManagerId,
      });

      if (key === "PROJECT_MANAGER") {
        await tx.project.update({ where: { id: context.projectId }, data: { managerId: user.id } });
      }
      if (context.teamId) {
        await tx.team.update({
          where: { id: context.teamId },
          data: { leaderMemberId: isLeadKey(key) ? member.id : undefined, leaderId: isLeadKey(key) ? user.id : undefined },
        });
        await syncTeamMembership(tx, member.id, context.teamId);
        await tx.member.update({
          where: { id: member.id },
          data: { teamName: context.team?.category ? CATEGORY_LABEL[String(context.team.category)] : context.team?.name },
        });
      }

      return assignment;
    });

    await auditLog({ actorId, action: "organization.member_register", entityType: "Member", entityId: result.id, after: { memberId: result.memberId } });
    return formatAssignment(result);
  },

  async updateMember(memberId: string, payload: any, actorId?: string) {
    const result = await prisma.$transaction(async (tx: any) => {
      const member = await tx.member.findUnique({
        where: { id: memberId },
        include: { user: true, orgAssignments: { where: { status: "ACTIVE" }, include: assignmentInclude } },
      });
      if (!member) throw new AppError("Member not found", 404);
      const currentAssignment = member.orgAssignments[0];

      const designation = payload.designationId || payload.designationKey || payload.designation
        ? await designationByRef(tx, payload)
        : currentAssignment?.designation;
      if (!designation) throw new AppError("Member has no designation to update", 400);
      const key = String(designation.key);
      const role = roleForDesignation(key, payload.role || member.user.role);
      const accountStatus = payload.accountStatus === "INACTIVE" || payload.status === "INACTIVE"
        ? "INACTIVE"
        : payload.accountStatus === "ACTIVE" || payload.status === "ACTIVE"
          ? "ACTIVE"
          : member.status;

      await demotePreviousManagement(tx, {
        userId: member.userId,
        memberId,
        ceo: key === "CEO",
        project: key === "PROJECT_MANAGER",
        lead: isLeadKey(key),
      });
      if (member.user.role === "PROJECT_MANAGER" && key !== "PROJECT_MANAGER") {
        await tx.project.updateMany({ where: { managerId: member.userId }, data: { managerId: null } });
      }
      if (member.user.role === "TEAM_LEADER" && !isLeadKey(key)) {
        await tx.team.updateMany({ where: { leaderMemberId: memberId }, data: { leaderMemberId: null, leaderId: null } });
      }
      if (member.user.role === "CEO" && key !== "CEO") {
        await tx.user.update({ where: { id: member.userId }, data: { ceoSlot: null } });
      }

      const requestedCategory = payload.teamCategory ? String(payload.teamCategory).trim().toUpperCase() : null;
      const contextPayload = {
        ...payload,
        projectId: payload.projectId ?? currentAssignment?.projectId,
        teamId: payload.teamId ?? currentAssignment?.teamId,
        teamCategory: requestedCategory ?? categoryFromKey(key) ?? currentAssignment?.team?.category ?? null,
        teamLeadId: payload.teamLeadId ?? currentAssignment?.teamLeadId,
      };
      const context = await resolveAssignmentContext(tx, contextPayload, designation, member.userId, memberId);

      await closeActiveAssignment(tx, memberId);
      await tx.member.update({
        where: { id: memberId },
        data: {
          memberId: payload.memberId ? String(payload.memberId) : undefined,
          phone: payload.phone !== undefined ? payload.phone : payload.contactNumber !== undefined ? payload.contactNumber : undefined,
          profilePicture: payload.profilePicture !== undefined ? payload.profilePicture : undefined,
          joiningDate: payload.joiningDate ? new Date(payload.joiningDate) : undefined,
          status: accountStatus as any,
          teamName: context.team ? (context.team.category ? CATEGORY_LABEL[String(context.team.category)] : context.team.name) : payload.teamName,
        },
      });
      await tx.user.update({
        where: { id: member.userId },
        data: {
          name: payload.name ? String(payload.name) : undefined,
          role: role as any,
          isActive: accountStatus === "ACTIVE",
          ceoSlot: key === "CEO" ? "CEO" : member.user.role === "CEO" ? null : undefined,
        },
      });
      await syncUserRoleLink(tx, member.userId, role);

      const assignment = await createAssignment(tx, {
        memberId,
        designationId: designation.id,
        projectId: context.projectId,
        teamId: context.teamId,
        teamLeadId: context.teamLeadId,
        projectManagerId: context.projectManagerId,
      });
      await syncTeamMembership(tx, memberId, context.teamId);

      if (key === "PROJECT_MANAGER" && context.projectId) {
        await tx.project.update({ where: { id: context.projectId }, data: { managerId: member.userId } });
      }
      if (isLeadKey(key) && context.teamId) {
        await tx.team.update({ where: { id: context.teamId }, data: { leaderMemberId: memberId, leaderId: member.userId } });
      }

      return assignment;
    });

    await auditLog({ actorId, action: "organization.member_update", entityType: "Member", entityId: memberId, after: { designation: result.designationId } });
    return formatAssignment(result);
  },

  async setMemberStatus(memberId: string, accountStatus: "ACTIVE" | "INACTIVE", actorId?: string) {
    const result = await prisma.$transaction(async (tx: any) => {
      const member = await tx.member.findUnique({ where: { id: memberId }, include: { user: true } });
      if (!member) throw new AppError("Member not found", 404);
      await closeActiveAssignment(tx, memberId);
      const updated = await tx.member.update({ where: { id: memberId }, data: { status: accountStatus } });
      await tx.user.update({ where: { id: member.userId }, data: { isActive: accountStatus === "ACTIVE" } });
      return updated;
    });
    await auditLog({ actorId, action: "organization.member_status", entityType: "Member", entityId: memberId, after: { status: accountStatus } });
    return result;
  },

  async removeTeamAssignment(memberId: string, actorId?: string) {
    const result = await prisma.$transaction(async (tx: any) => {
      await closeActiveAssignment(tx, memberId);
      await tx.teamMember.deleteMany({ where: { memberId } });
      await tx.member.update({ where: { id: memberId }, data: { teamName: null } });
      return { memberId, removed: true };
    });
    await auditLog({ actorId, action: "organization.member_unassigned", entityType: "Member", entityId: memberId });
    return result;
  },

  async listDesignations() {
    return prisma.designation.findMany({ orderBy: [{ isBuiltIn: "desc" }, { name: "asc" }] });
  },

  async createDesignation(payload: any, actorId?: string) {
    const name = String(payload.name || "").trim();
    const key = String(payload.key || name.toUpperCase().replace(/[^A-Z0-9]+/g, "_")).trim();
    if (!name || !key) throw new AppError("Designation name is required", 400);
    const created = await prisma.designation.create({ data: { name, key, description: payload.description || null, isBuiltIn: false } });
    await auditLog({ actorId, action: "organization.designation_create", entityType: "Designation", entityId: created.id, after: created });
    return created;
  },

  async updateDesignation(id: string, payload: any, actorId?: string) {
    const designation = await prisma.designation.findUnique({ where: { id } });
    if (!designation) throw new AppError("Designation not found", 404);
    if (designation.isBuiltIn) throw new AppError("Built-in designations cannot be changed", 400);
    const updated = await prisma.designation.update({
      where: { id },
      data: { name: payload.name ? String(payload.name) : undefined, description: payload.description !== undefined ? payload.description : undefined },
    });
    await auditLog({ actorId, action: "organization.designation_update", entityType: "Designation", entityId: id, after: updated });
    return updated;
  },

  async removeDesignation(id: string, actorId?: string) {
    const designation = await prisma.designation.findUnique({ where: { id }, include: { _count: { select: { assignments: true } } } });
    if (!designation) throw new AppError("Designation not found", 404);
    if (designation.isBuiltIn) throw new AppError("Built-in designations cannot be deleted", 400);
    if (designation._count.assignments) throw new AppError("Designation is in use", 409);
    await prisma.designation.delete({ where: { id } });
    await auditLog({ actorId, action: "organization.designation_delete", entityType: "Designation", entityId: id });
    return { id, removed: true };
  },

  async listProjects(user?: ReqUser) {
    const scope = await resolveOrgScope(user);
    const projects = await prisma.project.findMany({
      where: {
        orgSlot: { not: null },
        deletedAt: null,
        ...(scope.projectIds === "ALL" ? {} : { id: { in: scope.projectIds } }),
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        orgTeams: { where: { deletedAt: null }, orderBy: { category: "asc" }, include: { leaderMember: { include: { user: { select: { id: true, name: true } } } } } },
      },
      orderBy: { orgSlot: "asc" },
    });
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      orgSlot: p.orgSlot,
      status: p.status,
      manager: p.manager,
      teams: p.orgTeams.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        label: t.category ? CATEGORY_LABEL[t.category] : t.name,
        leader: t.leaderMember ? { id: t.leaderMember.id, memberId: t.leaderMember.memberId, name: t.leaderMember.user.name } : null,
      })),
    }));
  },

  async updateProject(projectId: string, payload: any, actorId?: string) {
    const project = await prisma.project.findFirst({ where: { id: projectId, orgSlot: { not: null }, deletedAt: null } });
    if (!project) throw new AppError("Organizational project not found", 404);
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: payload.name ? String(payload.name) : undefined,
        description: payload.description !== undefined ? payload.description : undefined,
        status: payload.status || undefined,
      },
    });
    await auditLog({ actorId, action: "organization.project_update", entityType: "Project", entityId: projectId, after: updated });
    return updated;
  },

  async updateTeam(teamId: string, payload: any, actorId?: string, user?: ReqUser) {
    const scope = await resolveOrgScope(user);
    const team = await prisma.team.findFirst({ where: { id: teamId, deletedAt: null } });
    if (!team) throw new AppError("Team not found", 404);
    assertTeamAccess(scope, team.id);
    assertProjectAccess(scope, team.projectId);
    const updated = await prisma.team.update({
      where: { id: teamId },
      data: { name: payload.name ? String(payload.name) : undefined, description: payload.description !== undefined ? payload.description : undefined },
    });
    await auditLog({ actorId, action: "organization.team_update", entityType: "Team", entityId: teamId, after: updated });
    return updated;
  },

  async listMembers(query: any, user?: ReqUser) {
    const scope = await resolveOrgScope(user);
    const where: any = {};
    if (scope.role === "MEMBER") {
      where.id = scope.memberId;
    } else if (scope.projectIds !== "ALL") {
      where.orgAssignments = { some: { status: "ACTIVE", ...(scope.projectIds.length ? { projectId: { in: scope.projectIds } } : { id: { in: [] } }) } };
    }

    const members = await prisma.member.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true, isActive: true, deletedAt: true } },
        orgAssignments: {
          where: { status: "ACTIVE" },
          include: assignmentInclude,
          orderBy: { effectiveFrom: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const q = String(query.q || "").toLowerCase();
    const rows = members
      .map((m) => ({ member: m, assignment: m.orgAssignments[0] || null }))
      .filter(({ assignment }) => {
        if (!query.designationId) return true;
        return assignment?.designationId === String(query.designationId);
      })
      .filter(({ assignment }) => {
        if (!query.projectId) return true;
        return assignment?.projectId === String(query.projectId);
      })
      .filter(({ assignment }) => {
        if (!query.teamId) return true;
        return assignment?.teamId === String(query.teamId);
      })
      .filter(({ assignment }) => {
        if (!query.accountStatus) return true;
        return String(assignment?.member?.status || "") === String(query.accountStatus).toUpperCase();
      })
      .filter(({ member, assignment }) => {
        if (!q) return true;
        return [member.memberId, member.user.name, member.user.email, assignment?.designation?.name, assignment?.project?.name, assignment?.team?.name]
          .some((value) => String(value || "").toLowerCase().includes(q));
      })
      .map(({ member, assignment }) => ({
        ...formatAssignment(assignment),
        member: {
          id: member.id,
          userId: member.userId,
          memberId: member.memberId,
          name: member.user.name,
          email: member.user.email,
          role: member.user.role,
          isActive: member.user.isActive,
          accountStatus: member.status,
          phone: member.phone,
          profilePicture: member.profilePicture,
          joiningDate: member.joiningDate,
          teamName: member.teamName,
        },
        assignmentId: assignment?.id ?? null,
      }));

    return { items: rows, pagination: { page: 1, limit: rows.length, total: rows.length, totalPages: 1 } };
  },

  async getMyProfile(user?: ReqUser) {
    const scope = await resolveOrgScope(user);
    if (!scope.memberId) return { member: null, assignment: null };
    const member = await prisma.member.findUnique({
      where: { id: scope.memberId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    return { member, assignment: formatAssignment(await getActiveAssignment(scope.memberId)) };
  },

  async getHierarchy(user?: ReqUser) {
    const scope = await resolveOrgScope(user);
    const assignments = await prisma.orgAssignment.findMany({ where: { status: "ACTIVE" }, include: assignmentInclude });
    const ceo = assignments.find((a) => a.designation.key === "CEO") || null;
    const projects = await prisma.project.findMany({
      where: {
        orgSlot: { not: null },
        deletedAt: null,
        ...(scope.projectIds === "ALL" ? {} : { id: { in: scope.projectIds } }),
      },
      include: { manager: { select: { id: true, name: true, email: true } }, orgTeams: { where: { deletedAt: null }, orderBy: { category: "asc" } } },
      orderBy: { orgSlot: "asc" },
    });

    const tree = projects.map((project) => {
      const projectAssignments = assignments.filter((a) => a.projectId === project.id);
      const managerAssignment = projectAssignments.find((a) => a.designation.key === "PROJECT_MANAGER") || null;
      const unassigned = projectAssignments.filter((a) => !a.teamId && a.designation.key !== "PROJECT_MANAGER");
      const teams = project.orgTeams
        .filter((team) => scope.teamIds === "ALL" || scope.teamIds.includes(team.id))
        .map((team) => {
          const category = team.category ? String(team.category) : "";
          const leadAssignment = assignments.find((a) => a.teamId === team.id && a.designation.key === TEAM_LEAD_DESIGNATION_KEY[category]) || null;
          const members = assignments
            .filter((a) => a.teamId === team.id && a.designation.key === DEVELOPER_DESIGNATION_KEY[category])
            .map((a) => formatAssignment(a));
          return {
            id: team.id,
            name: team.name,
            category: team.category,
            label: team.category ? CATEGORY_LABEL[team.category] : team.name,
            leader: formatAssignment(leadAssignment),
            members,
          };
        });
      return {
        id: project.id,
        name: project.name,
        orgSlot: project.orgSlot,
        status: project.status,
        manager: formatAssignment(managerAssignment),
        managerUser: project.manager,
        teams,
        unassigned: unassigned.map((a) => formatAssignment(a)),
      };
    });

    return { ceo: formatAssignment(ceo), projects: tree };
  },

  async validateOrganization(user?: ReqUser) {
    if (user && !["ADMIN", "COORDINATOR", "CEO"].includes(String(user.role))) {
      const scope = await resolveOrgScope(user);
      if (!scope.canManage) throw new AppError("Forbidden", 403);
    }
    const [activeAssignments, projects, activeMembers, users] = await Promise.all([
      prisma.orgAssignment.findMany({ where: { status: "ACTIVE" }, include: assignmentInclude }),
      prisma.project.findMany({ where: { orgSlot: { not: null }, deletedAt: null }, include: { orgTeams: { where: { deletedAt: null } } } }),
      prisma.member.findMany({ where: { status: "ACTIVE", user: { isActive: true, deletedAt: null } }, include: { user: true } }),
      prisma.user.findMany({ where: { role: "CEO", deletedAt: null }, select: { id: true } }),
    ]);

    const issues: any[] = [];
    const add = (code: string, message: string, extra: any = {}) => issues.push({ code, severity: "error", message, ...extra });
    const ceoUsers = activeAssignments.filter((a) => a.designation.key === "CEO");
    if (users.length !== 1) add("CEO_COUNT", `Exactly one CEO login is required (found ${users.length})`);
    if (ceoUsers.length !== 1) add("CEO_ASSIGNMENT", `Exactly one active CEO assignment is required (found ${ceoUsers.length})`);
    ceoUsers.forEach((a) => validateAssignment(a).forEach((message) => add("CEO_ASSIGNMENT_INVALID", message, { memberId: a.memberId })));

    if (projects.length !== 6) add("PROJECT_COUNT", `Exactly six organizational projects are required (found ${projects.length})`);
    for (let slot = 1; slot <= 6; slot++) {
      const matching = projects.filter((p) => p.orgSlot === slot);
      if (matching.length !== 1) add("PROJECT_SLOT", `Project slot ${slot} must have exactly one project (found ${matching.length})`);
    }

    for (const project of projects) {
      const pm = activeAssignments.find((a) => a.projectId === project.id && a.designation.key === "PROJECT_MANAGER");
      if (!pm) add("PROJECT_MANAGER_MISSING", `${project.name} has no assigned Project Manager`, { projectId: project.id });
      else validateAssignment(pm).forEach((message) => add("PROJECT_MANAGER_INVALID", message, { projectId: project.id, memberId: pm.memberId }));

      for (const category of TEAM_CATEGORIES) {
        const teams = project.orgTeams.filter((t) => t.category === category);
        if (teams.length !== 1) {
          add("TEAM_COUNT", `${project.name} must have exactly one ${CATEGORY_LABEL[category]} team (found ${teams.length})`, { projectId: project.id });
          continue;
        }
        const team = teams[0];
        const lead = activeAssignments.find((a) => a.teamId === team.id && a.designation.key === TEAM_LEAD_DESIGNATION_KEY[category]);
        if (!lead) add("TEAM_LEAD_MISSING", `${project.name} ${CATEGORY_LABEL[category]} team has no Team Lead`, { projectId: project.id, teamId: team.id });
        else validateAssignment(lead).forEach((message) => add("TEAM_LEAD_INVALID", message, { projectId: project.id, teamId: team.id, memberId: lead.memberId }));
      }
    }

    for (const member of activeMembers) {
      const assignment = activeAssignments.find((a) => a.memberId === member.id);
      if (!assignment) add("MEMBER_UNASSIGNED", `${member.user.name} has no active organizational assignment`, { memberId: member.id });
      else validateAssignment(assignment).forEach((message) => add("MEMBER_ASSIGNMENT_INVALID", `${member.user.name}: ${message}`, { memberId: member.id }));
    }

    return {
      canOpenAttendance: issues.length === 0,
      counts: {
        projects: projects.length,
        teams: projects.reduce((sum, p) => sum + p.orgTeams.length, 0),
        activeMembers: activeMembers.length,
        activeAssignments: activeAssignments.length,
        issues: issues.length,
      },
      issues,
    };
  },

  async getAttendanceRoster(user?: ReqUser) {
    const scope = await resolveOrgScope(user);
    const hierarchy = await this.getHierarchy(user);
    const warnings: any[] = [];
    const rows: any[] = [];

    if (scope.projectIds === "ALL" && hierarchy.ceo) {
      rows.push({
        assignmentId: hierarchy.ceo.id,
        memberRecordId: hierarchy.ceo.member?.id,
        memberId: hierarchy.ceo.member?.memberId,
        name: hierarchy.ceo.member?.name,
        project: "Organization",
        projectManager: null,
        team: null,
        designation: hierarchy.ceo.designation?.name,
        teamLead: null,
        attendanceEligible: hierarchy.ceo.isValid,
        issues: hierarchy.ceo.issues,
      });
    }

    for (const project of hierarchy.projects) {
      if (project.manager) {
        const call = {
          assignmentId: project.manager.id,
          memberRecordId: project.manager.member?.id,
          memberId: project.manager.member?.memberId,
          name: project.manager.member?.name,
          project: project.name,
          projectManager: project.manager.member?.name,
          team: null,
          designation: project.manager.designation?.name,
          teamLead: null,
          attendanceEligible: project.manager.isValid,
          issues: project.manager.issues,
        };
        rows.push(call);
        if (!call.attendanceEligible) warnings.push(call);
      }
      for (const team of project.teams) {
        if (team.leader) {
          const row = {
            assignmentId: team.leader.id,
            memberRecordId: team.leader.member?.id,
            memberId: team.leader.member?.memberId,
            name: team.leader.member?.name,
            project: project.name,
            projectManager: project.manager?.member?.name || null,
            team: team.label,
            designation: team.leader.designation?.name,
            teamLead: null,
            attendanceEligible: team.leader.isValid,
            issues: team.leader.issues,
          };
          rows.push(row);
          if (!row.attendanceEligible) warnings.push(row);
        }
        for (const member of team.members) {
          if (!member) continue;
          const row = {
            assignmentId: member.id,
            memberRecordId: member.member?.id,
            memberId: member.member?.memberId,
            name: member.member?.name,
            project: project.name,
            projectManager: project.manager?.member?.name || null,
            team: team.label,
            designation: member.designation?.name,
            teamLead: member.teamLead?.name || null,
            attendanceEligible: member.isValid,
            issues: member.issues,
          };
          rows.push(row);
          if (!row.attendanceEligible) warnings.push(row);
        }
      }
      for (const unassigned of project.unassigned) {
        if (!unassigned) continue;
        const row = {
          assignmentId: unassigned.id,
          memberRecordId: unassigned.member?.id,
          memberId: unassigned.member?.memberId,
          name: unassigned.member?.name,
          project: project.name,
          projectManager: project.manager?.member?.name || null,
          team: null,
          designation: unassigned.designation?.name,
          teamLead: null,
          attendanceEligible: false,
          issues: unassigned.issues.length ? unassigned.issues : ["Member is not assigned to a team"],
        };
        rows.push(row);
        warnings.push(row);
      }
    }

    return { scope: { role: scope.role }, hierarchy, rows, warnings };
  },
};
