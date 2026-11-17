# Technical Requirements Document (TRD)
## Team Algebra Club Tracker

| Field | Value |
|---|---|
| **Product Name** | Team Algebra Club Tracker |
| **Version** | 1.0 (Initial Release) |
| **Status** | Draft for Implementation |
| **Document Owner** | Engineering / Architecture |
| **Last Updated** | 2026-11-16 |
| **Related Document** | `docs/PRD.md` |

---

## 1. Purpose and Technical Objectives

This TRD defines the technical architecture, standards, and implementation blueprint for **Team Algebra Club Tracker**. It ensures the system is production-grade, secure, maintainable, and aligned with the fixed tech stack and **exact folder structure** provided.

**Objectives:** enforce consistent layered architecture, strong RBAC, reliable real-time collaboration, auditable data changes, reproducible environments (Docker), and comprehensive documentation/tests.

---

## 2. Fixed Technology Stack

### 2.1 Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Routing:** React Router v6
- **Server state:** TanStack Query
- **Client state:** Zustand
- **UI:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts
- **Forms & validation:** React Hook Form + Zod
- **3D:** Three.js via `@react-three/fiber` and `drei`
- **Animation:** Framer Motion
- **Real-time client:** Socket.io-client

### 2.2 Backend
- **Runtime/Framework:** Node.js + Express + TypeScript
- **ORM/DB:** Prisma ORM + PostgreSQL
- **Auth:** JWT (access + refresh tokens, **httpOnly cookies**) + bcrypt
- **Validation:** Zod
- **Uploads:** Multer
- **Real-time:** Socket.io
- **Scheduling:** node-cron
- **Email:** Nodemailer
- **Security/middleware:** Helmet, CORS, rate limiting

### 2.3 DevOps & Quality
- **Containers:** Docker + docker-compose (frontend, backend, postgres)
- **Config:** `.env.example` files
- **Lint/Format:** ESLint + Prettier
- **Testing:** Vitest/Jest for tests

---

## 3. Repository & Folder Structure (Authoritative)

The implementation **must follow this exact structure** (no renaming or skipping). Every file must contain real working code (no placeholders) during implementation.

```text
team-algebra-club-tracker/
│
├── frontend/
│   ├── public/
│   │   ├── images/
│   │   ├── icons/
│   │   ├── models/
│   │   ├── fonts/
│   │   └── logo/
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── providers.tsx
│   │   │
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── preloader/
│   │   │   ├── three-d/
│   │   │   ├── charts/
│   │   │   ├── forms/
│   │   │   ├── tables/
│   │   │   └── notifications/
│   │   │
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   ├── teams/
│   │   │   ├── members/
│   │   │   ├── tasks/
│   │   │   ├── milestones/
│   │   │   ├── progress/
│   │   │   ├── documents/
│   │   │   ├── attendance/
│   │   │   ├── leave/
│   │   │   ├── meetings/
│   │   │   ├── communication/
│   │   │   ├── announcements/
│   │   │   ├── analytics/
│   │   │   ├── knowledge/
│   │   │   ├── notifications/
│   │   │   ├── achievements/
│   │   │   └── audit/
│   │   │
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   ├── admin/
│   │   │   ├── coordinator/
│   │   │   ├── project-manager/
│   │   │   ├── team-leader/
│   │   │   └── member/
│   │   │
│   │   ├── routes/
│   │   │   ├── AppRoutes.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── RoleRoute.tsx
│   │   │
│   │   ├── services/
│   │   │   ├── apiClient.ts
│   │   │   ├── socketClient.ts
│   │   │   ├── uploadService.ts
│   │   │   └── downloadService.ts
│   │   │
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── store/
│   │   ├── types/
│   │   ├── constants/
│   │   ├── utils/
│   │   └── styles/
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── app.ts
│   │   │
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── environment.ts
│   │   │   ├── cors.ts
│   │   │   └── storage.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── role.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── upload.middleware.ts
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── permissions/
│   │   │   ├── projects/
│   │   │   ├── teams/
│   │   │   ├── team-members/
│   │   │   ├── members/
│   │   │   ├── member-skills/
│   │   │   ├── tasks/
│   │   │   ├── task-comments/
│   │   │   ├── milestones/
│   │   │   ├── progress/
│   │   │   ├── project-history/
│   │   │   ├── documents/
│   │   │   ├── attendance/
│   │   │   ├── leave/
│   │   │   ├── meetings/
│   │   │   ├── meeting-minutes/
│   │   │   ├── action-items/
│   │   │   ├── communication/
│   │   │   ├── announcements/
│   │   │   ├── analytics/
│   │   │   ├── knowledge/
│   │   │   ├── notifications/
│   │   │   ├── achievements/
│   │   │   ├── feedback/
│   │   │   └── audit/
│   │   │
│   │   ├── services/
│   │   │   ├── notification.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── report.service.ts
│   │   │   ├── file.service.ts
│   │   │   └── attendance.service.ts
│   │   │
│   │   ├── repositories/
│   │   ├── sockets/
│   │   ├── jobs/
│   │   ├── routes/
│   │   └── utils/
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   │
│   ├── uploads/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
│
├── database/
│   ├── design/
│   │   ├── database-erd.md
│   │   └── relationships.md
│   ├── seeds/
│   └── scripts/
│
├── docs/
│   ├── system-architecture.md
│   ├── frontend-architecture.md
│   ├── backend-architecture.md
│   ├── database-architecture.md
│   ├── api-documentation.md
│   └── setup-guide.md
│
├── docker/
│   └── docker-compose.yml
│
├── .gitignore
├── README.md
└── package.json
```

### 3.1 Structure Mapping Notes
- **Frontend feature modules** (`src/features/*`) encapsulate domain UI logic, API hooks (TanStack Query), components, and domain-specific helpers; **pages** (`src/pages/*`) compose features into route-level screens per audience/role.
- **Backend domain modules** (`src/modules/*`) each implement `routes`, `controller`, `service`, `repository`, and `validation schema` (and DTO/types as needed) following layered architecture.
- **Cross-cutting backend services** (`src/services/*`) provide shared capabilities (notifications, email, reports, files, attendance helpers) used by modules.
- **Database artifacts** are maintained in both `backend/prisma/*` (executable schema/seed/migrations) and `database/*` (design docs, seeds/scripts) per specified structure; content must be consistent.

---

## 4. System Architecture

### 4.1 High-Level Architecture
- **Client (SPA):** React app served by Vite/dev or static build; communicates with backend via REST (JSON) and Socket.io for real-time events.
- **API Server:** Express + TypeScript application exposing versioned REST endpoints, enforcing auth/RBAC/validation, and emitting socket events.
- **Database:** PostgreSQL accessed through Prisma Client with migrations and seed scripts.
- **File Storage:** Local uploads directory (`backend/uploads/`) managed via Multer and `file.service.ts`/`storage.ts` abstraction (role/context access checks enforced).
- **Background Processing:** node-cron jobs for reminders and reports; email delivery via Nodemailer.

### 4.2 Request/Data Flow (Typical)
1. UI action → React Hook Form/Zod (client validation) → feature API hook (TanStack Query)
2. `apiClient.ts` attaches credentials/cookies context and calls REST endpoint
3. Express route → validation middleware (Zod) → auth/role middleware → controller
4. Controller → service (business logic, authorization scope checks) → repository (Prisma/data access)
5. Response returned in standard envelope; side effects may emit socket events, notifications, emails, or audit logs

---

## 5. Frontend Architecture

### 5.1 Application Bootstrap
- `src/app/main.tsx`: entry point, mounts app, imports global styles
- `src/app/providers.tsx`: composes providers (TanStack Query, router context if needed, theme, Zustand hydration, socket/context providers, toasts)
- `src/app/App.tsx`: root component wiring routes/layout/preloader

### 5.2 Routing & Guards
- `routes/AppRoutes.tsx`: route definitions for public and authenticated areas (admin/coordinator/project-manager/team-leader/member)
- `routes/ProtectedRoute.tsx`: requires authenticated session; redirects to login as appropriate
- `routes/RoleRoute.tsx`: enforces role/permission-based access to role-specific routes/pages
- **RBAC UI rule:** conditionally render actions/components based on permissions/role from auth/user state

### 5.3 State Management
- **TanStack Query:** server state (fetching, caching, mutations, invalidation, pagination params)
- **Zustand:** client/UI state (sidebar, theme, command palette, transient UI, socket presence state as needed)
- **Context (`context/`) & hooks (`hooks/`):** shared cross-cutting concerns (auth/session, theme, socket listeners) where appropriate

### 5.4 Services Layer (`src/services/`)
- `apiClient.ts`: centralized HTTP client (base URL, credentials/cookies, interceptors/handlers, error normalization, refresh handling integration)
- `socketClient.ts`: Socket.io-client connection, auth handshake, reconnection, event subscription helpers
- `uploadService.ts` / `downloadService.ts`: file upload/download/preview helpers (progress, blob handling)

### 5.5 Feature Modules (`src/features/*`)
Each domain feature should provide:
- API hooks/queries/mutations (TanStack Query)
- Domain components and forms (RHF + Zod schemas)
- Types/selectors/helpers as needed
- Real-time event handling hooks for relevant modules (tasks, communication, notifications)

### 5.6 UI Components & UX Requirements
- **Layout:** `components/layout` (sidebar, topbar, breadcrumbs), global search `Ctrl+K` command palette, notification bell, profile menu
- **Reusable:** `components/tables` DataTable (sort/filter/paginate/export), `components/forms`, modals/toasts, skeleton loaders, empty states, error boundaries
- **Charts:** `components/charts` using Recharts
- **3D:** `components/three-d` with lazy-loading and graceful fallback; **preloader:** `components/preloader` with club logo
- **Accessibility:** WCAG AA, keyboard navigation, focus states, ARIA semantics
- **Theming:** dark/light mode with consistent Tailwind/shadcn tokens

### 5.7 Public Pages & Role Dashboards
- Public: `pages/public/` (Landing, About, Projects showcase, Achievements, Contact, Login/Register)
- Role dashboards: `pages/admin/`, `pages/coordinator/`, `pages/project-manager/`, `pages/team-leader/`, `pages/member/`

---

## 6. Backend Architecture

### 6.1 Application Bootstrap
- `src/server.ts`: HTTP server creation, Socket.io initialization/attachment, startup (DB connectivity checks), cron/job registration
- `src/app.ts`: Express app setup (Helmet, CORS, body parsing, cookies, rate limiting, routes mounting, error handling)

### 6.2 Configuration (`src/config/`)
- `environment.ts`: typed env loading/validation (fail fast on missing critical vars)
- `database.ts`: Prisma client lifecycle/config
- `cors.ts`: whitelist configuration
- `storage.ts`: upload/storage paths and constraints

### 6.3 Layered Module Pattern (`src/modules/<domain>/`)
Each module implements and wires:
- **`*.routes.ts`**: endpoint definitions, middleware chaining (auth, role/permission, validation, upload)
- **`*.controller.ts`**: request/response orchestration, no direct DB logic
- **`*.service.ts`**: business rules, scope/permission checks, transactions, orchestration of repositories/services/events
- **`*.repository.ts`**: Prisma data access (queries/mutations), mapping/persistence concerns
- **`*.validation.ts` (Zod schemas)**: request body/query/params validation

> Central route aggregation occurs in `src/routes/` to mount all module routes consistently (including API versioning, e.g. `/api/v1`).

### 6.4 Middleware (`src/middleware/`)
- `auth.middleware.ts`: verifies access token (cookie/header strategy as defined), attaches user/session context
- `role.middleware.ts`: enforces role/permission requirements per route
- `validation.middleware.ts`: Zod-based request validation with structured errors
- `error.middleware.ts`: global error handling and response normalization
- `upload.middleware.ts`: Multer configuration (type/size limits, storage)

### 6.5 Shared Services (`src/services/`)
- `notification.service.ts`: in-app notification creation/dispatch and preference checks
- `email.service.ts`: Nodemailer transport/templates for verification, reset, reminders, reports
- `report.service.ts`: CSV/PDF/export/report generation utilities
- `file.service.ts`: file metadata, versioning support, safe access paths
- `attendance.service.ts`: attendance domain helpers/calculations/report support

### 6.6 Real-Time (Socket.io) (`src/sockets/`)
- Authenticated socket connections (token/cookie validation)
- Room/channel strategy: user rooms, team rooms, project rooms (and conversation rooms for chat)
- Event categories: **chat messages**, **typing indicators/unread updates**, **notifications**, **task/project updates**
- Emit events from services/controllers after successful mutations; clients invalidate/refetch via TanStack Query as appropriate

### 6.7 Background Jobs (`src/jobs/`)
- **Deadline reminders** (tasks/milestones/projects as applicable)
- **Daily attendance summary**
- **Weekly report email**
- Implemented with `node-cron`, using shared services (`email.service.ts`, `report.service.ts`, `attendance.service.ts`) and robust logging/error handling

### 6.8 Utilities (`src/utils/`)
- Async handler wrapper, response helpers, pagination/sort/filter builders, token/cookie helpers, date utilities, audit helpers, etc.

---

## 7. API Design & Standards

### 7.1 REST Conventions
- Resource-oriented endpoints under a versioned base path (e.g. `/api/v1`)
- Proper HTTP methods and status codes
- **Pagination, sorting, filtering on all list endpoints** (standard query params, e.g. `page`, `limit`, `sort`, `order`, filters)

### 7.2 Standard Response Envelope
All API responses use a consistent format:
```json
{
  "success": true,
  "data": {},
  "message": "string",
  "errors": null
}
```
- On error: `success: false`, appropriate `message`, and structured `errors` (validation/details) as applicable.

### 7.3 Validation & Error Handling
- **Input validation on every endpoint** (Zod schemas via `validation.middleware.ts`)
- Central `error.middleware.ts` handles operational/validation/auth/permission/not-found/server errors consistently
- Async handler wrapper to avoid unhandled promise rejections

### 7.4 Documentation
- Generate and maintain `docs/api-documentation.md` and/or **Swagger/OpenAPI** covering all endpoints, auth, params, request/response schemas, and error cases

---

## 8. Authentication, Authorization & Security

### 8.1 Authentication
- **JWT access + refresh tokens** stored in **httpOnly cookies** (secure/sameSite configured per environment)
- **bcrypt** for password hashing
- Flows: register, login, logout, refresh token, forgot/reset password, change password, email verification
- Token rotation/invalidation strategy implemented in auth module/services (and persisted if required by design)

### 8.2 Authorization (RBAC)
- Roles: **Admin, Coordinator, Project Manager, Team Leader, Member**
- Enforced at:
  1. **Backend:** `auth.middleware.ts` + `role.middleware.ts` (and service-level scope checks for ownership/team/project context)
  2. **Frontend:** `ProtectedRoute.tsx`, `RoleRoute.tsx`
  3. **UI:** conditional rendering of controls/data
- Permissions model managed via Users/Roles/Permissions modules

### 8.3 Security Controls
- **Helmet**, **CORS whitelist** (`config/cors.ts`), **rate limiting**
- Input validation and sanitization (OWASP basics), safe serialization
- Upload protections in `upload.middleware.ts` and `file.service.ts`: allowed MIME/types, size limits, safe filenames/paths, access checks
- Secure cookie settings and environment-driven secrets
- No sensitive data leakage in errors/logs

---

## 9. Data Architecture (Prisma / PostgreSQL)

### 9.1 Schema Requirements (`backend/prisma/schema.prisma`)
- Complete coverage for all modules:
  `auth/users/roles/permissions`, `projects/project-history`, `teams/team-members`, `members/member-skills`, `tasks/task-comments`, `milestones/progress`, `documents`, `attendance`, `leave`, `meetings/meeting-minutes/action-items`, `communication`, `announcements` (+ read receipts/targets), `analytics` (as needed for persisted aggregates/materialized views if any), `knowledge`, `notifications` (+ preferences), `achievements/feedback`, `audit`
- **Proper relations** (1-1, 1-N, M-N via join tables such as team-members, role-permissions, targets/receipts where appropriate)
- **Enums** for statuses/types/priorities/roles-related fixed domains (e.g. ProjectStatus: Planning/Active/On Hold/Completed; task/leave/attendance states)
- **Indexes** for frequent query paths (foreign keys, status/date filters, search fields, unique lookups)
- **Unique constraints** where required (emails, tokens/identifiers, composite uniqueness for join tables)
- **Soft deletes where sensible** (e.g. users, projects, documents, announcements/content) with consistent query filtering
- **`createdAt`/`updatedAt`** on all relevant models

### 9.2 Migrations & Seeding
- Migrations stored in `backend/prisma/migrations/`
- `backend/prisma/seed.ts` (and/or `database/seeds/`) provisions: **1 admin, 1 coordinator, 2 project managers, 3 team leaders, 15 members**, plus sample **projects, tasks, attendance, meetings, and announcements**

### 9.3 Database Design Documentation
- `database/design/database-erd.md`: Mermaid ERD covering core entities and relations
- `database/design/relationships.md`: textual description of cardinalities, constraints, and key relationship rules
- `docs/database-architecture.md`: schema strategy, indexing/soft-delete conventions, and data lifecycle notes

---

## 10. Module Implementation Specifications (Backend + Frontend)

| Module | Backend (`src/modules/*`) | Frontend (`src/features/*`, `src/pages/*`) | Key Technical Notes |
|---|---|---|---|
| Auth | auth | auth, public login/register | JWT cookies, refresh, verification/reset/change flows |
| Users/Roles/Permissions | users, roles, permissions | admin + related features | RBAC management, activate/deactivate |
| Projects | projects, project-history | projects, PM/admin views | Status enum, deadlines, team assignment, timeline |
| Teams/Members | teams, team-members, members, member-skills | teams, members | Leader assignment, membership joins, skill proficiency search/filter |
| Tasks/Comments | tasks, task-comments | tasks | Kanban DnD + list, priorities/status/due/assignees/subtasks, mentions, socket updates |
| Milestones/Progress | milestones, progress | milestones, progress | Auto-calculated progress, burndown view |
| Documents | documents | documents | Multer upload, versioning, folders, role/context access, preview/download |
| Attendance | attendance | attendance | Check-in/out, sessions, calendar, reports, CSV/PDF export |
| Leave | leave | leave | Apply/approve-reject with remarks, balances, calendar overlay |
| Meetings | meetings, meeting-minutes, action-items | meetings | Schedule/agenda/minutes, action items → tasks, reminders |
| Communication | communication | communication | Socket.io team/project channels, typing, unread, file sharing |
| Announcements | announcements | announcements | Role/team targeting, pinned, read receipts |
| Analytics | analytics | analytics, dashboards | Role-scoped KPIs, date filters, exports |
| Knowledge | knowledge | knowledge | Categories/tags/search, markdown editor |
| Notifications | notifications | notifications | In-app real-time + email, read state, preferences |
| Achievements/Feedback | achievements, feedback | achievements | Badges/points, peer/leader feedback, leaderboard |
| Audit | audit | audit (admin) | Log create/update/delete/login with user/IP/timestamp/before-after, admin-only filtered viewer |

---

## 11. File Uploads & Document Handling
- **Multer** via `upload.middleware.ts` with strict file type/size limits
- Storage path/config in `config/storage.ts`; persisted files under `backend/uploads/`
- `file.service.ts` manages metadata, versioning, and safe retrieval; downloads/preview via controlled endpoints and `downloadService.ts`
- Access control enforced by role and resource context (project/team/ownership)

---

## 12. Real-Time Events (Socket.io)

| Domain | Example Events (illustrative) | Consumers |
|---|---|---|
| Communication | message created, typing start/stop, unread count updates | Channel/team/project participants |
| Notifications | notification created/read | Target user(s) |
| Tasks/Projects | task created/updated/moved/commented, progress updates | Project/team members, dashboards |

- Socket auth required; users join authorized rooms only.
- Server emits after committed mutations; clients reconcile via TanStack Query invalidation/updates.

---

## 13. Background Jobs (node-cron)
- **Deadline reminders:** scan upcoming due tasks/milestones and notify via in-app/email
- **Daily attendance summary:** aggregate and distribute summaries to relevant roles/users
- **Weekly report email:** generate and send periodic performance/attendance/project summaries
- Jobs located in `backend/src/jobs/`, scheduled from `server.ts` (or dedicated bootstrap), using shared services with idempotent/safe execution patterns where possible

---

## 14. DevOps, Environment & Deployment

### 14.1 Docker & Compose
- `docker/docker-compose.yml` runs **frontend, backend, postgres** with one command
- Service networking, volumes for Postgres data and uploads (as configured), and environment injection via `.env` files
- Health/startup ordering to ensure DB readiness before migrations/server start (implementation detail)

### 14.2 Environment Configuration
- Provide `.env.example` files (root and/or per service as needed) documenting all required variables:
  - App/ports/URLs, DB connection, JWT secrets/expiries/cookie settings, CORS origins, SMTP/email config, upload limits/paths, rate-limit settings
- `config/environment.ts` validates required configuration at startup

### 14.3 Scripts & Developer Workflow
- Install, migrate, seed, and run steps documented in `README.md` and `docs/setup-guide.md`
- Include demo login credentials per role (aligned with seed data)

---

## 15. Testing Strategy
- **Unit tests (Vitest/Jest):** core services and auth logic (token handling, password flows, RBAC decisions, key domain calculations like progress/attendance helpers)
- **API integration tests:** selected critical flows (auth, RBAC-protected endpoints, CRUD for core modules, validation/error envelope)
- Tests located in `backend/tests/` (and frontend test setup as applicable per tooling); runnable in CI/local environments
- Aim for reliable, deterministic tests using seeded/test databases or isolated fixtures

---

## 16. Documentation Deliverables
- `README.md` (root): overview, quick start, demo credentials
- `docs/setup-guide.md`: exact install, migrate, seed, run steps
- `docs/system-architecture.md`: end-to-end architecture
- `docs/frontend-architecture.md`: app structure, state, routing/guards, UI patterns
- `docs/backend-architecture.md`: layers, modules, middleware, services, sockets, jobs
- `docs/database-architecture.md`: schema conventions, migrations/seeds, data access patterns
- `docs/api-documentation.md` (and/or Swagger/OpenAPI): complete endpoint reference
- `database/design/database-erd.md` (Mermaid ERD) and `database/design/relationships.md`

---

## 17. Implementation Standards & Quality Gates
- **No placeholders/TODOs/mock-only logic** in delivered implementation phases; consistent shared types and no broken imports
- ESLint + Prettier enforced; TypeScript strictness configured appropriately
- Accessibility (WCAG AA), keyboard navigation, and responsive behavior verified for key flows
- Security review checklist: auth/cookies, RBAC coverage, validation, upload safety, rate limits, CORS
- Performance considerations: pagination everywhere, query efficiency, lazy-loading for heavy assets (3D)

---

## 18. Open Technical Decisions (to finalize during implementation, without changing fixed architecture)
- Exact API versioning/prefix convention and cookie vs header fallback details for clients/tools
- Token storage/rotation persistence model (e.g. refresh token records) within Prisma schema
- Specific socket namespace/room naming and event payload contracts (documented in API/socket docs)
- PDF/CSV generation libraries and export templates (within allowed stack/tooling choices)
- Search implementation for knowledge/global search (DB-based vs indexed) consistent with performance needs

> Any decision impacting the fixed folder structure, core tech stack, or module boundaries requires explicit approval before adoption.
