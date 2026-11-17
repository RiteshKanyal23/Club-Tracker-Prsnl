import { z } from "zod";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: passwordSchema,
  }),
});

export const adminRegisterSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    adminId: z.string().min(2),
    password: passwordSchema,
    confirmPassword: z.string().min(1),
    acceptTerms: z.literal(true),
  }).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] }),
});

export const memberRegisterSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    memberId: z.string().min(1),
    email: z.string().email(),
    phoneNumber: z.string().optional().nullable(),
    teamName: z.string().optional().nullable(),
    password: passwordSchema,
    confirmPassword: z.string().min(1),
    acceptTerms: z.literal(true),
  }).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1), // email or member/admin identifier
    password: z.string().min(1),
    portal: z.enum(["admin", "member"]).optional(),
  }),
});

export const forgotPasswordSchema = z.object({ body: z.object({ email: z.string().email(), portal: z.enum(["admin", "member"]).optional() }) });
export const resetPasswordSchema = z.object({ body: z.object({ token: z.string().min(10), password: passwordSchema, confirmPassword: z.string().optional(), portal: z.enum(["admin", "member"]).optional() }).refine((d) => !d.confirmPassword || d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] }) });
export const changePasswordSchema = z.object({ body: z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema }) });
export const verifyEmailSchema = z.object({ body: z.object({ token: z.string().min(10), portal: z.enum(["admin", "member"]).optional() }) });
export const resendVerificationSchema = z.object({ body: z.object({ email: z.string().email(), portal: z.enum(["admin", "member"]).optional() }) });
