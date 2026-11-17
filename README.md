# Team Algebra Club Tracker

Production-grade lab and team tracking platform for managing projects, teams, members, tasks, attendance, meetings, documents, and analytics.

## Stack
- **Frontend:** React 18 + TypeScript + Vite, React Router v6, TanStack Query, Zustand, Tailwind CSS + shadcn/ui, Recharts, React Hook Form + Zod, Three.js (@react-three/fiber, drei), Framer Motion, Socket.io-client
- **Backend:** Node.js + Express + TypeScript, Prisma ORM + PostgreSQL, JWT (access + refresh, httpOnly cookies), bcrypt, Zod, Multer, Socket.io, node-cron, Nodemailer, Helmet, CORS, rate limiting
- **DevOps:** Docker + docker-compose, ESLint + Prettier, Vitest/Jest

## Repository Structure
Follows the architecture defined in project specification (`frontend/`, `backend/`, `database/`, `docs/`, `docker/`). See `docs/PRD.md` and `docs/TRD.md` for details.

## Quick Start (Docker)
1. Copy environment examples and configure values:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env`
2. Start the stack:
   - `docker compose -f docker/docker-compose.yml up --build`
3. Run migrations and seed (in backend container or locally with DB available):
   - `docker compose -f docker/docker-compose.yml exec backend npx prisma migrate deploy`
   - `docker compose -f docker/docker-compose.yml exec backend npx prisma db seed`

> For detailed local setup, see `docs/setup-guide.md`.

## Default URLs (Docker/dev)
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api/v1
- PostgreSQL: localhost:5432

## Demo Credentials (after seed)
| Role | Email | Password |
|---|---|---|
| Admin | admin@teamalgebra.local | Password123! |
| Coordinator | coordinator@teamalgebra.local | Password123! |
| Project Manager | pm1@teamalgebra.local | Password123! |
| Team Leader | lead1@teamalgebra.local | Password123! |
| Member | member1@teamalgebra.local | Password123! |

> Credentials are created by `backend/prisma/seed.ts` in later phases; update if changed.

## Documentation
- `docs/PRD.md` — Product Requirements
- `docs/TRD.md` — Technical Requirements
- `docs/system-architecture.md`
- `docs/frontend-architecture.md`
- `docs/backend-architecture.md`
- `docs/database-architecture.md`
- `docs/api-documentation.md`
- `docs/setup-guide.md`

## Phase Status
- **Foundations:** scaffolding, Docker setup, base configs, docs.
- **Backend:** auth + RBAC (JWT access/refresh cookies), users/roles/permissions, members & teams, projects/milestones/tasks, attendance (camera check-in), leave, meetings & minutes, action items, documents/versions, announcements, notifications, knowledge base, feedback, achievements, audit log, analytics, OpenAPI docs, Socket.io, cron jobs.
- **Frontend:** role-based portals (admin/member), login/registration flows, dashboards, module pages, cinematic preloader and gaming-style UI, TanStack Query data layer, Playwright e2e scaffold.
- **Verification:** `npm run lint` (0 errors), `npm test` (19 backend + 7 frontend tests), `npm run build` (backend + frontend) all pass.
