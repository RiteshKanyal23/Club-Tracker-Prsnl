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
includes `api/[...path].js`). A copy of the proxy and config exists under
`frontend/` for projects configured with `frontend/` as the root.

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

Then open the Vercel URL on a phone (mobile data, not the office Wi-Fi) and on a
desktop browser, sign in through **Admin Portal**, and confirm the admin
dashboard loads after a refresh (session check via `/auth/me`).

## Security note

`backend/.env` on the original machine contained a real-looking Gmail app
password. Rotate that password and keep `.env` files out of version control.
