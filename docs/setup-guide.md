# Setup Guide

## Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm

## Environment
1. Copy env examples:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env`
2. Adjust secrets, DB URL, SMTP, and CORS as needed.

## Run with Docker
```bash
docker compose -f docker/docker-compose.yml up --build
```
- Frontend: http://localhost:5173
- Backend: http://localhost:4000/api/v1
- Postgres: localhost:5432

## Database (inside backend container or local with DB access)
```bash
npx prisma generate
npx prisma migrate dev --name phase1_auth_rbac   # or `npx prisma migrate deploy` in Docker/prod
npx prisma db seed
```

## Phase 1 (Auth/RBAC) notes
- Auth uses **JWT access + refresh tokens in httpOnly cookies**; ensure `CORS_ORIGIN` and cookie settings match your frontend origin.
- Email verification/reset tokens are sent via SMTP if configured, otherwise logged to backend console as `[email:mock]` in development.
- Admin-only management APIs: `/api/v1/users`, `/api/v1/roles`, `/api/v1/permissions` (require authenticated Admin).

## Run locally (without Docker)
```bash
# backend
cd backend && npm install && npm run dev
# frontend
cd frontend && npm install && npm run dev
```

## Demo credentials (after seed)
- admin@teamalgebra.local / Password123!
- coordinator@teamalgebra.local / Password123!
- pm1@teamalgebra.local / Password123!
- lead1@teamalgebra.local / Password123!
- member1@teamalgebra.local / Password123!
