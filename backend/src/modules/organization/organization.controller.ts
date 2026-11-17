import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { AuthRequest } from "../../middleware/auth.middleware";
import { OrganizationService } from "./organization.service";

export const OrganizationController = {
  hierarchy: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.getHierarchy(req.user), "Organization hierarchy")),

  validation: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.validateOrganization(req.user), "Pre-attendance validation")),

  roster: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.getAttendanceRoster(req.user), "Attendance roster")),

  members: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.listMembers(req.query, req.user), "Organization members")),

  myProfile: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.getMyProfile(req.user), "My organization profile")),

  projects: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.listProjects(req.user), "Organizational projects")),

  registerMember: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.registerMember(req.body, req.user?.id), "Lab member registered", 201)),

  updateMember: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.updateMember(req.params.memberId, req.body, req.user?.id), "Lab member updated")),

  setMemberStatus: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.setMemberStatus(req.params.memberId, req.body.accountStatus, req.user?.id), "Member status updated")),

  removeTeamAssignment: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.removeTeamAssignment(req.params.memberId, req.user?.id), "Member removed from team")),

  designations: asyncHandler(async (_req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.listDesignations(), "Designations")),

  createDesignation: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.createDesignation(req.body, req.user?.id), "Designation created", 201)),

  updateDesignation: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.updateDesignation(req.params.id, req.body, req.user?.id), "Designation updated")),

  removeDesignation: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.removeDesignation(req.params.id, req.user?.id), "Designation deleted")),

  updateProject: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.updateProject(req.params.projectId, req.body, req.user?.id), "Project updated")),

  updateTeam: asyncHandler(async (req: AuthRequest, res: Response) =>
    ok(res, await OrganizationService.updateTeam(req.params.teamId, req.body, req.user?.id, req.user), "Team updated")),
};
