import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { AuthService } from "./auth.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const data = await AuthService.register(res, req.body);
    return ok(res, data, "Registration successful. Please verify your email.", 201);
  }),
  registerAdmin: asyncHandler(async (req: Request, res: Response) => {
    const data = await AuthService.registerAdmin(req.body);
    return ok(res, data, "Admin registration submitted. Please verify your email.", 201);
  }),
  registerMember: asyncHandler(async (req: Request, res: Response) => {
    const data = await AuthService.registerMember(req.body);
    return ok(res, data, "Member registration successful. Please verify your email.", 201);
  }),
  login: asyncHandler(async (req: Request, res: Response) => {
    const data = await AuthService.login(res, req.body);
    return ok(res, data, "Logged in");
  }),
  logout: asyncHandler(async (req: Request, res: Response) => {
    const data = await AuthService.logout(res, req.cookies?.refreshToken);
    return ok(res, data, "Logged out");
  }),
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const data = await AuthService.refresh(res, req.cookies?.refreshToken);
    return ok(res, data, "Token refreshed");
  }),
  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const data = await AuthService.forgotPassword(req.body);
    return ok(res, data, data.message || "If the email exists, a reset link was sent");
  }),
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const data = await AuthService.resetPassword(req.body);
    return ok(res, data, data.message || "Password reset");
  }),
  changePassword: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await AuthService.changePassword(req.user!.id, req.body);
    return ok(res, data, "Password changed");
  }),
  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const data = await AuthService.verifyEmail(req.body);
    return ok(res, data, data.message || "Email verified");
  }),
  resendVerification: asyncHandler(async (req: Request, res: Response) => {
    const data = await AuthService.resendVerification(req.body);
    return ok(res, data, data.message || "Verification email sent");
  }),
  me: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await AuthService.me(req.user!.id);
    return ok(res, data, "Current user");
  }),
};
