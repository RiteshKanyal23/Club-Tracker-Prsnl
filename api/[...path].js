/**
 * Vercel proxy for the Express backend.
 *
 * The Vite bundle calls the API at the SAME origin (`/api/v1/...`), so:
 *  - no browser can be sent to `localhost` (the original "Failed to fetch" bug),
 *  - no CORS preflight or cross-site cookie issues,
 *  - HTTPS works everywhere (desktop, mobile, any network).
 *
 * Set `BACKEND_URL` in the Vercel project (Production + Preview), e.g.
 * `https://my-club-tracker-backend.onrender.com` (origin only, no /api suffix).
 */

export const config = { api: { bodyParser: false } };

const API_PREFIX = "/api";
const PROXY_PREFIX = "/api/proxy";
const DUPLICATE_API_PREFIX = "/api/api/";
const SOCKET_PREFIX = "/socket.io";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "content-encoding",
  "host",
]);

function stripPrefix(pathname, prefix) {
  if (pathname === prefix) return "/";
  return pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname;
}

/**
 * Normalize every path Vercel can hand to this catch-all into the exact path
 * the Express app mounts. Depending on routing order, the function may see:
 *   /api/v1/auth/login          (rewrite bypassed; catch-all matched directly)
 *   /api/proxy/v1/auth/login    (vercel.json rewrite applied)
 *   /api/proxy/api/v1/auth/login
 *   /api/api/v1/auth/login      (older, broken deployments)
 * All must become /api/v1/auth/login. Socket paths are passed through.
 */
export function resolveUpstreamPath(rawUrl = "/") {
  const incoming = new URL(rawUrl || "/", "http://localhost");
  let pathname = incoming.pathname;

  while (pathname === PROXY_PREFIX || pathname.startsWith(`${PROXY_PREFIX}/`)) {
    pathname = stripPrefix(pathname, PROXY_PREFIX);
  }
  while (pathname.startsWith(DUPLICATE_API_PREFIX)) {
    pathname = pathname.slice(API_PREFIX.length);
  }

  const isApiPath = pathname === API_PREFIX || pathname.startsWith(`${API_PREFIX}/`);
  if (pathname.startsWith(SOCKET_PREFIX) || isApiPath) {
    return `${pathname}${incoming.search}`;
  }

  return `${API_PREFIX}${pathname.startsWith("/") ? "" : "/"}${pathname}${incoming.search}`;
}

export function resolveUpstreamTarget(rawUrl, backendUrl) {
  return `${String(backendUrl).replace(/\/+$/, "")}${resolveUpstreamPath(rawUrl)}`;
}

function json(res, status, body) {
  res.status(status);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

export default async function handler(req, res) {
  const backendUrl = (process.env.BACKEND_URL || "").trim().replace(/\/+$/, "");
  if (!backendUrl) {
    return json(res, 503, {
      success: false,
      message: "Backend URL is not configured. Set BACKEND_URL in the Vercel project's Environment Variables and redeploy.",
    });
  }
  if (!/^https?:\/\//i.test(backendUrl)) {
    return json(res, 503, { success: false, message: "BACKEND_URL must be an absolute http(s) URL." });
  }

  const method = (req.method || "GET").toUpperCase();
  const target = resolveUpstreamTarget(req.url || "/", backendUrl);

  const headers = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (value === undefined || HOP_BY_HOP.has(key.toLowerCase())) continue;
    headers[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }
  headers["x-forwarded-host"] = headers["x-forwarded-host"] || req.headers?.host || "";
  headers["x-forwarded-proto"] = headers["x-forwarded-proto"] || "https";

  try {
    const body = ["GET", "HEAD"].includes(method) ? undefined : await readBody(req);
    const upstream = await fetch(target, { method, headers, body, redirect: "manual" });

    res.status(upstream.status);
    for (const [key, value] of upstream.headers.entries()) {
      if (HOP_BY_HOP.has(key.toLowerCase())) continue;
      if (key.toLowerCase() === "set-cookie") {
        const cookies = typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [value];
        res.setHeader("set-cookie", cookies);
        continue;
      }
      res.setHeader(key, value);
    }
    res.setHeader("Cache-Control", "no-store");
    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.end(buffer);
  } catch (error) {
    console.error("[api-proxy] upstream request failed", error);
    return json(res, 502, {
      success: false,
      message: "The backend service is unreachable. Please try again later or contact the site administrator.",
    });
  }
}
