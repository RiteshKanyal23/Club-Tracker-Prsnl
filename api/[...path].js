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

const PROXY_PREFIX = "/api/proxy";
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

  const incoming = new URL(req.url || "/", "http://localhost");
  const rewrittenPath = incoming.pathname.startsWith(PROXY_PREFIX) ? incoming.pathname.slice(PROXY_PREFIX.length) : incoming.pathname;
  // WebSocket handshakes keep their /socket.io path; REST calls live at /api/...
  const upstreamPath = rewrittenPath.startsWith("/socket.io") ? rewrittenPath : `/api${rewrittenPath.startsWith("/") ? rewrittenPath : `/${rewrittenPath}`}`;
  const target = `${backendUrl}${upstreamPath}${incoming.search}`;

  const headers = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (value === undefined || HOP_BY_HOP.has(key.toLowerCase())) continue;
    headers[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }
  headers["x-forwarded-host"] = headers["x-forwarded-host"] || req.headers?.host || "";
  headers["x-forwarded-proto"] = headers["x-forwarded-proto"] || "https";

  try {
    const body = ["GET", "HEAD"].includes(req.method || "GET") ? undefined : await readBody(req);
    const upstream = await fetch(target, { method: req.method, headers, body, redirect: "manual" });

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
