import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { OrganizationController } from "./organization.controller";
import {
  designationSchema,
  memberStatusSchema,
  registerMemberSchema,
  updateDesignationSchema,
  updateMemberSchema,
  updateProjectSchema,
  updateTeamSchema,
} from "./organization.validation";

export const organizationRouter = Router();
organizationRouter.use(authMiddleware);

const managers = ["ADMIN", "COORDINATOR"];

organizationRouter.get("/hierarchy", OrganizationController.hierarchy);
organizationRouter.get("/me", OrganizationController.myProfile);
organizationRouter.get("/roster", OrganizationController.roster);
organizationRouter.get("/members", OrganizationController.members);
organizationRouter.get("/projects", OrganizationController.projects);
organizationRouter.get("/designations", OrganizationController.designations);

organizationRouter.get("/validation", requireRoles("ADMIN", "COORDINATOR", "CEO"), OrganizationController.validation);

organizationRouter.post("/members", requireRoles(...managers), validateBody(registerMemberSchema.shape.body), OrganizationController.registerMember);
organizationRouter.put("/members/:memberId", requireRoles(...managers), validateBody(updateMemberSchema.shape.body), OrganizationController.updateMember);
organizationRouter.patch("/members/:memberId/status", requireRoles(...managers), validateBody(memberStatusSchema.shape.body), OrganizationController.setMemberStatus);
organizationRouter.delete("/members/:memberId/team", requireRoles(...managers), OrganizationController.removeTeamAssignment);

organizationRouter.post("/designations", requireRoles(...managers), validateBody(designationSchema.shape.body), OrganizationController.createDesignation);
organizationRouter.put("/designations/:id", requireRoles(...managers), validateBody(updateDesignationSchema.shape.body), OrganizationController.updateDesignation);
organizationRouter.delete("/designations/:id", requireRoles(...managers), OrganizationController.removeDesignation);

organizationRouter.patch("/projects/:projectId", requireRoles(...managers), validateBody(updateProjectSchema.shape.body), OrganizationController.updateProject);
organizationRouter.patch("/teams/:teamId", requireRoles(...managers), validateBody(updateTeamSchema.shape.body), OrganizationController.updateTeam);
