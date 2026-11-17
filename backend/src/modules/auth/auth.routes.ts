import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "./auth.controller";
import { validateBody } from "../../middleware/validation.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  registerSchema, adminRegisterSchema, memberRegisterSchema, loginSchema,
  forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, verifyEmailSchema, resendVerificationSchema
} from "./auth.validation";

const sensitiveAuthLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "Too many requests, please try again later." } });
const strictAuthLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "Too many requests, please try again later." } });

export const authRouter = Router();

authRouter.post("/register", strictAuthLimit, validateBody(registerSchema.shape.body), AuthController.register);
authRouter.post("/admin/register", strictAuthLimit, validateBody(adminRegisterSchema.shape.body), AuthController.registerAdmin);
authRouter.post("/member/register", strictAuthLimit, validateBody(memberRegisterSchema.shape.body), AuthController.registerMember);
authRouter.post("/login", sensitiveAuthLimit, validateBody(loginSchema.shape.body), AuthController.login);
authRouter.post("/logout", AuthController.logout);
authRouter.post("/refresh", sensitiveAuthLimit, AuthController.refresh);
authRouter.post("/forgot-password", strictAuthLimit, validateBody(forgotPasswordSchema.shape.body), AuthController.forgotPassword);
authRouter.post("/reset-password", strictAuthLimit, validateBody(resetPasswordSchema.shape.body), AuthController.resetPassword);
authRouter.post("/change-password", authMiddleware, validateBody(changePasswordSchema.shape.body), AuthController.changePassword);
authRouter.post("/verify-email", sensitiveAuthLimit, validateBody(verifyEmailSchema.shape.body), AuthController.verifyEmail);
authRouter.post("/resend-verification", strictAuthLimit, validateBody(resendVerificationSchema.shape.body), AuthController.resendVerification);
authRouter.get("/me", authMiddleware, AuthController.me);
