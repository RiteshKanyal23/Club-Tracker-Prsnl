import nodemailer from "nodemailer";
import { env } from "../config/environment";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || "localhost",
  port: env.SMTP_PORT || 1025,
  secure: env.smtpSecure,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

export const emailService = {
  async send(to: string, subject: string, text: string, html?: string) {
    if (!env.SMTP_HOST) {
      console.log("[email:mock]", { to, subject, text });
      return { mocked: true };
    }
    try {
      return await transporter.sendMail({ from: env.SMTP_FROM || "noreply@teamalgebra.local", to, subject, text, html });
    } catch (err: any) {
      // Fallback: do not block auth flows if SMTP is unreachable/misconfigured
      console.error("[email:error] SMTP send failed, falling back to mock:", err?.message || err);
      console.log("[email:mock-fallback]", { to, subject, text });
      return { mocked: true, fallback: true, error: err?.message };
    }
  },
};
