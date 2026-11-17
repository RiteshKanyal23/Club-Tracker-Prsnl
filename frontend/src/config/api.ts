/**
 * Single source of truth for backend connectivity.
 *
 * Vite inlines `import.meta.env.*` at BUILD TIME. A value that is only set on
 * one developer machine (or left as a fallback) therefore gets baked into the
 * bundle shipped to Vercel. That is exactly what caused "Failed to fetch":
 * every visitor's browser called `http://localhost:4000` on their own device.
 *
 * Rules:
 *  - Local development (no VITE_API_BASE_URL configured): use the local backend.
 *  - Production: NEVER fall back to localhost. Prefer the same-origin
 *    `/api/v1` proxy configured in vercel.json, or an explicitly configured
 *    `VITE_API_BASE_URL` (must be an absolute https URL, not a loopback URL).
 *
 * `import.meta.env.DEV` is replaced with a literal by Vite, so the local-only
 * branch (and its localhost URL) is removed from the production bundle.
 */

export const LOCAL_API_BASE_URL = "http://localhost:4000/api/v1";
export const LOCAL_SOCKET_URL = "http://localhost:4000";
export const PROXY_API_BASE_URL = "/api/v1";
export const PROXY_SOCKET_URL = "/socket.io";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0"]);

function normalize(value: string | undefined): string {
  return (value || "").trim().replace(/\/+$/, "");
}

function isLoopbackUrl(value: string): boolean {
  try {
    const url = new URL(value, "http://relative.invalid");
    return LOOPBACK_HOSTS.has(url.hostname) || /\.localhost$/i.test(url.hostname);
  } catch {
    return value.toLowerCase().includes("localhost");
  }
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function warn(message: string) {
  if (typeof console !== "undefined") console.warn(`[config] ${message}`);
}

/** Production resolution: only https URLs or same-origin proxy paths are allowed. */
function resolveProductionUrl(configured: string | undefined, proxyPath: string): string {
  const value = normalize(configured);
  if (!value) return proxyPath;
  if (isLoopbackUrl(value)) {
    warn(`Ignoring loopback URL in production (${value}); using ${proxyPath}. Set a public https API URL in Vercel.`);
    return proxyPath;
  }
  if (isAbsoluteHttpUrl(value) && !value.startsWith("https://")) {
    warn(`API/socket URL must use https in production (${value}); using ${proxyPath}.`);
    return proxyPath;
  }
  return value;
}

/** Pure helper used by local development and unit tests. */
export function resolveApiBaseUrl(configured: string | undefined, isDev: boolean): string {
  if (isDev) return normalize(configured) || LOCAL_API_BASE_URL;
  return resolveProductionUrl(configured, PROXY_API_BASE_URL);
}

/** Pure helper used by local development and unit tests. */
export function resolveSocketUrl(configured: string | undefined, isDev: boolean): string {
  if (isDev) return normalize(configured) || LOCAL_SOCKET_URL;
  return resolveProductionUrl(configured, PROXY_SOCKET_URL);
}

const configuredApiUrl = normalize(import.meta.env.VITE_API_BASE_URL);
const configuredSocketUrl = normalize(import.meta.env.VITE_SOCKET_URL);

export const API_BASE_URL = import.meta.env.DEV ? resolveApiBaseUrl(configuredApiUrl, true) : resolveProductionUrl(configuredApiUrl, PROXY_API_BASE_URL);
export const SOCKET_URL = import.meta.env.DEV ? resolveSocketUrl(configuredSocketUrl, true) : resolveProductionUrl(configuredSocketUrl, PROXY_SOCKET_URL);

/** Build a full API URL from a path such as `/auth/login`. */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Origin of the API host (empty for same-origin proxy mode). */
export function apiOrigin(): string {
  return isAbsoluteHttpUrl(API_BASE_URL) ? new URL(API_BASE_URL).origin : "";
}
