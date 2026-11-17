# Production deployment (Vercel frontend + Express API)

## Root cause of "Failed to fetch"

Vite inlines `VITE_*` variables **at build time**. The shipped bundle had
`http://localhost:4000/api/v1` baked in (from `frontend/.env` and the fallback in
`src/services/apiClient.ts`). On a Vercel site that URL resolves to **each visitor's
own device**, where no backend is listening. It appeared to work only on the
developer's machine because that machine was running the backend on port 4000.
The raw browser `TypeError: Failed to fetch` was then displayed verbatim by the
login page.

The fix has three parts:

1. Production never falls back to localhost. Without an explicit production API
   URL the frontend uses the **same-origin** paths `/api/v1` and `/socket.io`.
2. `vercel.json` proxies those paths to the Express backend using `BACKEND_URL`.
3. Network failures are translated into actionable error messages.

## Root cause of the Admin Login `405`

The Admin Login button was never the problem. It correctly sends:

```http
POST /api/v1/auth/login
Content-Type: application/json

{"email":"...","password":"...","portal":"admin"}
```

The Express route is also correctly registered as
`POST /api/v1/auth/login`; password hashing, JWT cookies and the ADMIN role
check are unchanged. The failure was in the Vercel proxy layer:

1. When the Vercel project root is `frontend/`, the required
   `frontend/api/[...path].js` function was **not committed**, so there was no
   proxy function to handle `/api/v1/auth/login`. Vercel fell through to static
   handling and a `POST` to a static route returned `405`.
2. When the catch-all proxy did run, it stripped only `/api/proxy` and then
   unconditionally prepended `/api`. If Vercel routed the original path
   directly to the function (or the rewrite was bypassed), the backend received
   `/api/api/v1/auth/login` instead of `/api/v1/auth/login`.

The fix normalizes all of the following to a single path before forwarding:

- `/api/v1/auth/login`
- `/api/proxy/v1/auth/login`
- `/api/proxy/api/v1/auth/login`
- `/api/api/v1/auth/login`

It keeps `/socket.io/...` paths intact, forwards every requested method with
headers and raw bodies, and returns the backend's real status code and JSON.
A genuine upstream `405` is still surfaced as `405`; it is not hidden or
replaced with a fake success.

## 1. Host the backend

The Express API must be reachable over public HTTPS (Render, Railway, Fly, a VPS,
etc.). It cannot be `localhost` or a private LAN address. Run:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:deploy     # apply migrations
npm run build
NODE_ENV=production npm start
```

Backend production environment variables:

| Variable | Example | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Enables secure cookies |
| `PORT` | `4000` | Or the host's assigned port |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/team_algebra?schema=public` | Hosted PostgreSQL, not localhost |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | long random values | Never the `change-me` defaults |
| `CORS_ORIGIN` | `https://your-app.vercel.app` | Exact origin(s), comma-separated. No `*`. |
| `APP_URL` / `FRONTEND_URL` | `https://your-app.vercel.app` | Used for verification/reset links |
| `COOKIE_SECURE` | `true` | Automatic in production |
| `COOKIE_SAME_SITE` | `lax` with the proxy; `none` for direct cross-origin API calls | `none` requires `Secure` |
| `SMTP_*` | your provider | For real verification/reset emails |
| `ADMIN_INVITE_CODE` | secret | Restricts admin self-registration where enforced |

CORS allows `GET, POST, PUT, PATCH, DELETE, OPTIONS`, the `Content-Type` and
`Authorization` headers, credentials, and answers `OPTIONS` preflights with 204.

## 2. Configure Vercel

Set these in **Project → Settings → Environment Variables** for **Production**
(and Preview), then **redeploy** — `VITE_*` values are compiled into the bundle,
so a rebuild is mandatory after any change:

| Variable | Value |
|---|---|
| `BACKEND_URL` | `https://your-backend-host` (origin only; no `/api` suffix) |
| `VITE_API_BASE_URL` | `/api/v1` (same-origin proxy) — already set in the committed `frontend/.env.production` |
| `VITE_SOCKET_URL` | `/socket.io` — already set in `frontend/.env.production` |
| `VITE_APP_NAME` | `Team Algebra Club Tracker` |

If you prefer calling the backend directly instead of using the proxy, set
`VITE_API_BASE_URL=https://your-backend-host/api/v1` and
`VITE_SOCKET_URL=https://your-backend-host`, add the Vercel domain to the
backend's `CORS_ORIGIN`, and set `COOKIE_SAME_SITE=none`. Do **not** set a
`localhost` value in Vercel.

Deploy from the repository root (the root `vercel.json` builds the Vite app and
includes `api/[...path].js`). If the Vercel project root is `frontend/`, Vercel
uses `frontend/vercel.json` and `frontend/api/[...path].js` instead. **Both
proxy copies are committed and kept identical**; a test enforces that, because
an untracked `frontend/api/[...path].js` is what allowed the deployed `405`.

`BACKEND_URL` must be the backend **origin only** (no `/api` or `/api/v1`
suffix). Do not put a localhost or private LAN address in Vercel. Do not commit
`.env` files or backend secrets.

After changing any environment variable or proxy file, create a new deployment
(or redeploy with cache cleared). `VITE_*` values are compiled into the bundle,
so an old build will keep its old API URL.

## 3. Verify

```bash
# Backend health (should report database: ok)
curl https://your-backend-host/api/v1/health

# Vercel proxy health (same JSON, through the frontend domain)
curl https://your-app.vercel.app/api/v1/health

# CORS preflight from the deployed frontend origin
curl -i -X OPTIONS https://your-backend-host/api/v1/auth/login \
  -H 'Origin: https://your-app.vercel.app' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type,authorization'
# Expect Access-Control-Allow-Origin: https://your-app.vercel.app
# and Access-Control-Allow-Credentials: true

# Admin login through the deployed site
curl -i -X POST https://your-app.vercel.app/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@teamalgebra.local","password":"Password123!","portal":"admin"}'
```

Expected results:

| Check | Expected |
|---|---|
| `GET /api/v1/health` through Vercel | `200` with the same JSON as the backend health endpoint |
| Valid admin login | `200`, JSON with the admin user, and `Set-Cookie` headers |
| Wrong admin password | `401` with the backend's real invalid-credentials message |
| Member login | `200` for a valid member account; no `portal: "admin"` is sent |
| Any upstream method rejection | The backend's actual status, including a real `405` if one occurs |

If the site still returns `405` after redeploying, check the Vercel **Root
Directory**. A `frontend/` root must have `frontend/api/[...path].js` in the
deployed commit; a repository root must have the top-level `api/[...path].js`.
Then confirm `BACKEND_URL` is set for the Production environment and inspect the
function logs for `[api-proxy]`.

Finally, open the Vercel URL on a phone (mobile data, not the office Wi-Fi) and
on a second desktop browser. Sign in through **Admin Portal**, reload the page,
and confirm the admin dashboard remains (session check via `/auth/me`). Repeat
with an invalid password and with a member account.

## Security note

`backend/.env` on the original machine contained a real-looking Gmail app
password. Rotate that password and keep `.env` files out of version control.
