import { z } from "zod";

const accountStatus = z.enum(["ACTIVE", "INACTIVE"]).optional();
const teamCategory = z
  .preprocess(
    (value) => (typeof value === "string" && value.trim() ? value.trim().toUpperCase() : value),
    z.enum(["FRONTEND", "BACKEND", "DATABASE"]),
  )
  .optional();

const memberBase = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  memberId: z.string().min(1).optional(),
  phone: z.string().optional(),
  contactNumber: z.string().optional(),
  profilePicture: z.string().optional(),
  projectId: z.string().optional(),
  teamCategory,
  designationId: z.string().optional(),
  designationKey: z.string().optional(),
  teamLeadId: z.string().optional(),
  joiningDate: z.string().optional(),
  accountStatus,
  status: accountStatus,
});

export const registerMemberSchema = z.object({
  body: memberBase.extend({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    memberId: z.string().min(1),
  }),
});

export const updateMemberSchema = z.object({ body: memberBase });

export const memberStatusSchema = z.object({
  body: z.object({ accountStatus: z.enum(["ACTIVE", "INACTIVE"]) }),
});

export const designationSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    key: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
});

export const updateDesignationSchema = z.object({
  body: z.object({ name: z.string().min(1).optional(), description: z.string().optional() }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"]).optional(),
  }),
});

export const updateTeamSchema = z.object({
  body: z.object({ name: z.string().min(1).optional(), description: z.string().optional() }),
});
