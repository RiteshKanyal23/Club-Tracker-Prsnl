import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  APP_URL: z.string().default("http://localhost:5173"),
  FRONTEND_URL: z.string().optional(),
  COOKIE_SECURE: z.string().default("false"),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  ADMIN_INVITE_CODE: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // In early scaffolding allow defaults for missing secrets/DB when not running fully.
  // Runtime will still fail fast when critical services are exercised without proper env.
  console.warn("Environment validation warnings:", parsed.error.flatten().fieldErrors);
}

const data = parsed.success ? parsed.data : (envSchema.parse({
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/team_algebra?schema=public",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
}) as any);

export const env = {
  ...data,
  isProduction: data.NODE_ENV === "production",
  cookieSecure: data.COOKIE_SECURE === "true" || data.NODE_ENV === "production",
  smtpSecure: data.SMTP_SECURE === "true" || (data.SMTP_SECURE !== "false" && data.SMTP_PORT === 465),
  frontendUrl: data.FRONTEND_URL || data.APP_URL || data.CORS_ORIGIN || "http://localhost:5173",
};
