import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";

export type ReqUser = { id: string; role?: string; email?: string };

export type OrgScope = {
  role: string;
  userId: string;
  memberId?: string;
  projectIds: string[] | "ALL";
  teamIds: string[] | "ALL";
  projectNames: string[] | "ALL";
  teamNames: string[] | "ALL";
  canManage: boolean;
  canWriteAttendance: boolean;
  isStaff: boolean;
};

const MANAGEMENT_ROLES = ["ADMIN", "COORDINATOR"];
const ATTENDANCE_WRITE_ROLES = ["ADMIN", "COORDINATOR", "PROJECT_MANAGER", "TEAM_LEADER"];

export const CATEGORY_LABEL: Record<string, string> = {
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  DATABASE: "Database",
};

export const TEAM_LEAD_DESIGNATION_KEY: Record<string, string> = {
  FRONTEND: "FRONTEND_TEAM_LEAD",
  BACKEND: "BACKEND_TEAM_LEAD",
  DATABASE: "DATABASE_TEAM_LEAD",
};

export const DEVELOPER_DESIGNATION_KEY: Record<string, string> = {
  FRONTEND: "FRONTEND_DEVELOPER",
  BACKEND: "BACKEND_DEVELOPER",
  DATABASE: "DATABASE_DEVELOPER",
};

export async function resolveOrgScope(user?: ReqUser): Promise<OrgScope> {
  if (!user?.id) throw new AppError("Unauthorized", 401);
  const role = String(user.role || "");
  const base: OrgScope = {
    role,
    userId: user.id,
    projectIds: [],
    teamIds: [],
    projectNames: [],
    teamNames: [],
    canManage: MANAGEMENT_ROLES.includes(role),
    canWriteAttendance: ATTENDANCE_WRITE_ROLES.includes(role),
    isStaff: role !== "MEMBER",
  };

  if (MANAGEMENT_ROLES.includes(role) || role === "CEO") {
    return {
      ...base,
      projectIds: "ALL",
      teamIds: "ALL",
      projectNames: "ALL",
      teamNames: "ALL",
    };
  }

  if (role === "PROJECT_MANAGER") {
    const projects = await prisma.project.findMany({
      where: { managerId: user.id, orgSlot: { not: null }, deletedAt: null },
      select: { id: true, name: true },
    });
    const teams = projects.length
      ? await prisma.team.findMany({
          where: { projectId: { in: projects.map((p) => p.id) }, deletedAt: null },
          select: { id: true, name: true, category: true },
        })
      : [];
    return {
      ...base,
      projectIds: projects.map((p) => p.id),
      teamIds: teams.map((t) => t.id),
      projectNames: projects.map((p) => p.name),
      teamNames: teams.map((t) => (t.category ? CATEGORY_LABEL[t.category] : t.name)),
    };
  }

  if (role === "TEAM_LEADER") {
    const member = await prisma.member.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!member) throw new AppError("Member profile not found", 404);
    const teams = await prisma.team.findMany({
      where: { OR: [{ leaderMemberId: member.id }, { leaderId: user.id }], deletedAt: null },
      select: { id: true, name: true, category: true, projectId: true },
    });
    const projects = teams.length
      ? await prisma.project.findMany({
          where: { id: { in: teams.map((t) => t.projectId!).filter(Boolean) } },
          select: { id: true, name: true },
        })
      : [];
    return {
      ...base,
      memberId: member.id,
      projectIds: projects.map((p) => p.id),
      teamIds: teams.map((t) => t.id),
      projectNames: projects.map((p) => p.name),
      teamNames: teams.map((t) => (t.category ? CATEGORY_LABEL[t.category] : t.name)),
    };
  }

  if (role === "MEMBER") {
    const member = await prisma.member.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!member) throw new AppError("Member profile not found", 404);
    const assignment = await prisma.orgAssignment.findFirst({
      where: { memberId: member.id, status: "ACTIVE" },
      include: { project: { select: { id: true, name: true } }, team: { select: { id: true, name: true, category: true } } },
    });
    return {
      ...base,
      memberId: member.id,
      projectIds: assignment?.projectId ? [assignment.projectId] : [],
      teamIds: assignment?.teamId ? [assignment.teamId] : [],
      projectNames: assignment?.project ? [assignment.project.name] : [],
      teamNames: assignment?.team ? [assignment.team.category ? CATEGORY_LABEL[assignment.team.category] : assignment.team.name] : [],
    };
  }

  throw new AppError("Forbidden", 403);
}

export function assertManage(scope: OrgScope) {
  if (!scope.canManage) throw new AppError("Forbidden", 403);
}

export function assertAttendanceWrite(scope: OrgScope) {
  if (!scope.canWriteAttendance) throw new AppError("Forbidden", 403);
}

export function assertProjectAccess(scope: OrgScope, projectId?: string | null) {
  if (!projectId) return;
  if (scope.projectIds === "ALL") return;
  if (!scope.projectIds.includes(projectId)) throw new AppError("Forbidden", 403);
}

export function assertTeamAccess(scope: OrgScope, teamId?: string | null) {
  if (!teamId) return;
  if (scope.teamIds === "ALL") return;
  if (!scope.teamIds.includes(teamId)) throw new AppError("Forbidden", 403);
}

export const assignmentInclude = {
  member: {
    include: {
      user: { select: { id: true, name: true, email: true, role: true, isActive: true, deletedAt: true } },
    },
  },
  designation: true,
  project: {
    include: {
      manager: { select: { id: true, name: true, email: true } },
    },
  },
  team: true,
  teamLead: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
  projectManager: { select: { id: true, name: true, email: true } },
};

export async function getActiveAssignment(memberId: string) {
  return prisma.orgAssignment.findFirst({
    where: { memberId, status: "ACTIVE" },
    include: assignmentInclude,
  });
}

export async function getActiveAssignmentByUserId(userId: string) {
  const member = await prisma.member.findUnique({ where: { userId }, select: { id: true } });
  if (!member) return null;
  return getActiveAssignment(member.id);
}

export function formatAssignment(assignment: any) {
  if (!assignment) return null;
  const member = assignment.member;
  const issues = validateAssignment(assignment);
  return {
    id: assignment.id,
    status: assignment.status,
    effectiveFrom: assignment.effectiveFrom,
    effectiveTo: assignment.effectiveTo,
    member: member
      ? {
          id: member.id,
          userId: member.userId,
          memberId: member.memberId,
          name: member.user?.name,
          email: member.user?.email,
          role: member.user?.role,
          isActive: member.user?.isActive,
          accountStatus: member.status,
          phone: member.phone,
          profilePicture: member.profilePicture,
          joiningDate: member.joiningDate,
          teamName: member.teamName,
        }
      : null,
    designation: assignment.designation
      ? { id: assignment.designation.id, key: assignment.designation.key, name: assignment.designation.name }
      : null,
    project: assignment.project
      ? {
          id: assignment.project.id,
          name: assignment.project.name,
          orgSlot: assignment.project.orgSlot,
          manager: assignment.project.manager
            ? { id: assignment.project.manager.id, name: assignment.project.manager.name, email: assignment.project.manager.email }
            : null,
        }
      : null,
    team: assignment.team
      ? {
          id: assignment.team.id,
          name: assignment.team.name,
          category: assignment.team.category,
          label: assignment.team.category ? CATEGORY_LABEL[assignment.team.category] : assignment.team.name,
          leaderMemberId: assignment.team.leaderMemberId,
        }
      : null,
    teamLead: assignment.teamLead
      ? {
          id: assignment.teamLead.id,
          memberId: assignment.teamLead.memberId,
          name: assignment.teamLead.user?.name,
          email: assignment.teamLead.user?.email,
        }
      : null,
    projectManager: assignment.projectManager
      ? { id: assignment.projectManager.id, name: assignment.projectManager.name, email: assignment.projectManager.email }
      : null,
    isValid: issues.length === 0,
    issues,
  };
}

export function validateAssignment(assignment: any): string[] {
  const issues: string[] = [];
  if (!assignment) return ["No active assignment"];
  const key = String(assignment.designation?.key || "");
  const member = assignment.member;
  const role = String(member?.user?.role || "");
  const active = member?.user?.isActive && !member?.user?.deletedAt && member?.status === "ACTIVE";

  if (!member?.memberId) issues.push("Missing Member ID");
  if (!active) issues.push("Member account is inactive");

  if (key === "CEO") {
    if (role !== "CEO") issues.push("CEO designation requires the CEO login role");
    if (assignment.projectId || assignment.teamId || assignment.teamLeadId) issues.push("CEO must not be assigned to a project, team, or team lead");
    return issues;
  }

  if (key === "PROJECT_MANAGER") {
    if (role !== "PROJECT_MANAGER") issues.push("Project Manager designation requires the PROJECT_MANAGER login role");
    if (!assignment.projectId) issues.push("Project Manager has no assigned project");
    if (assignment.projectId && assignment.project?.managerId !== member?.userId) issues.push("Project Manager is not assigned to their project");
    if (assignment.teamId) issues.push("Project Manager must not be assigned to a developer team");
    return issues;
  }

  const category = assignment.team?.category ? String(assignment.team.category) : "";
  if (key.endsWith("_TEAM_LEAD")) {
    if (role !== "TEAM_LEADER") issues.push("Team Lead designation requires the TEAM_LEADER login role");
    if (!assignment.projectId) issues.push("Team Lead has no assigned project");
    if (!assignment.teamId) issues.push("Team Lead has no assigned team");
    if (category && TEAM_LEAD_DESIGNATION_KEY[category] !== key) issues.push("Team Lead designation does not match the team category");
    if (assignment.team?.projectId && assignment.team.projectId !== assignment.projectId) issues.push("Team Lead's team belongs to a different project");
    if (assignment.team?.leaderMemberId && assignment.team.leaderMemberId !== member?.id) issues.push("Team Lead is not the designated leader of the team");
    if (assignment.teamLeadId && assignment.teamLeadId !== member?.id) issues.push("Team Lead must not report to another team lead");
    return issues;
  }

  if (key.endsWith("_DEVELOPER")) {
    if (role !== "MEMBER") issues.push("Developer designation requires the MEMBER login role");
    if (!assignment.projectId) issues.push("Member has no assigned project");
    if (!assignment.teamId) issues.push("Member has no assigned team");
    if (!assignment.teamLeadId) issues.push("Member has no assigned Team Lead");
    if (category && DEVELOPER_DESIGNATION_KEY[category] !== key) issues.push("Designation does not match the team category");
    if (assignment.team?.projectId && assignment.team.projectId !== assignment.projectId) issues.push("Member's team belongs to a different project");
    if (assignment.team?.leaderMemberId && assignment.team.leaderMemberId !== assignment.teamLeadId) issues.push("Assigned Team Lead does not lead the member's team");
    if (assignment.teamLead?.id && assignment.teamLead.id !== assignment.teamLeadId) issues.push("Assigned Team Lead does not exist");
    return issues;
  }

  // Custom designations only require a Member ID and an inactive-safe profile.
  return issues;
}

export function buildAttendanceSnapshot(assignment: any) {
  return {
    assignmentId: assignment?.id ?? null,
    designationId: assignment?.designationId ?? null,
    memberIdText: assignment?.member?.memberId ?? null,
    memberName: assignment?.member?.user?.name ?? null,
    projectName: assignment?.project?.name ?? null,
    projectManagerName: assignment?.project?.manager?.name ?? assignment?.projectManager?.name ?? null,
    teamName: assignment?.team
      ? assignment.team.category
        ? CATEGORY_LABEL[String(assignment.team.category)]
        : assignment.team.name
      : null,
    teamLeadName: assignment?.teamLead?.user?.name ?? null,
    designationName: assignment?.designation?.name ?? null,
  };
}

export async function assertAttendanceTarget(scope: OrgScope, targetMemberId: string) {
  const assignment = await getActiveAssignment(targetMemberId);
  if (!assignment) throw new AppError("Member is not registered in the organization hierarchy", 409);
  const issues = validateAssignment(assignment);
  if (issues.length) throw new AppError(`Invalid member assignment: ${issues.join("; ")}`, 409);

  if (scope.memberId && scope.memberId !== targetMemberId) throw new AppError("Forbidden", 403);
  if (scope.projectIds !== "ALL" && assignment.projectId && !scope.projectIds.includes(assignment.projectId)) {
    throw new AppError("Forbidden", 403);
  }
  if (scope.teamIds !== "ALL" && assignment.teamId && !scope.teamIds.includes(assignment.teamId)) {
    throw new AppError("Forbidden", 403);
  }
  return assignment;
}

export function orgAssignmentScopeWhere(scope: OrgScope): any {
  if (scope.role === "MEMBER") return { memberId: scope.memberId };
  if (scope.projectIds === "ALL") return {};
  const or: any[] = [];
  if (scope.projectIds.length) or.push({ projectId: { in: scope.projectIds } });
  if (scope.teamIds.length) or.push({ teamId: { in: scope.teamIds } });
  return or.length ? { OR: or } : { id: { in: [] } };
}

export function attendanceScopeWhere(scope: OrgScope): any {
  if (scope.role === "MEMBER") {
    return { memberId: scope.memberId };
  }
  if (scope.projectIds === "ALL") return {};
  const or: any[] = [];
  if (scope.projectNames !== "ALL" && scope.projectNames.length) {
    or.push({ projectName: { in: scope.projectNames } });
  }
  if (scope.projectIds.length) {
    or.push({ member: { orgAssignments: { some: { status: "ACTIVE", projectId: { in: scope.projectIds } } } } });
  }
  if (scope.teamNames !== "ALL" && scope.teamNames.length) {
    or.push({ teamName: { in: scope.teamNames } });
  }
  if (scope.teamIds !== "ALL" && scope.teamIds.length) {
    or.push({ member: { orgAssignments: { some: { status: "ACTIVE", teamId: { in: scope.teamIds } } } } });
  }
  return or.length ? { OR: or } : { id: { in: [] } };
}
