import { CorsOptions } from "cors";
import { env } from "./environment";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/** Collapse loopback aliases so "localhost:5173" also permits "127.0.0.1:5173". */
function normalizeOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    const host = LOOPBACK_HOSTS.has(hostname) ? "localhost" : hostname;
    return `${url.protocol}//${host}${url.port ? `:${url.port}` : ""}`;
  } catch {
    return origin.toLowerCase();
  }
}

const origins: string[] = env.CORS_ORIGIN.split(",")
  .map((o: string) => o.trim())
  .filter(Boolean)
  .map(normalizeOrigin);

// Ports explicitly configured (e.g. the Vite dev server port).
const allowedPorts = new Set(
  origins
    .map((o) => {
      try {
        return new URL(o).port;
      } catch {
        return "";
      }
    })
    .filter(Boolean),
);

// Private-network hosts, so browsing the app over the LAN URL Vite advertises works in dev.
const PRIVATE_HOST =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3})$/;

function isDevLanOrigin(origin: string): boolean {
  if (env.isProduction) return false;
  try {
    const url = new URL(origin);
    return PRIVATE_HOST.test(url.hostname) && (allowedPorts.size === 0 || allowedPorts.has(url.port));
  } catch {
    return false;
  }
}

/** Shared by Express CORS and Socket.io so both enforce the same allow-list. */
export function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true; // same-origin / non-browser clients
  return origins.includes(normalizeOrigin(origin)) || isDevLanOrigin(origin);
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    // Deny cleanly: omit the CORS headers instead of throwing, which surfaced as an unhandled 500.
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};
