# Product Requirements Document (PRD)
## Team Algebra Club Tracker

| Field | Value |
|---|---|
| **Product Name** | Team Algebra Club Tracker |
| **Version** | 1.0 (Initial Release) |
| **Status** | Draft for Implementation |
| **Document Owner** | Product / Engineering |
| **Last Updated** | 2026-11-16 |

---

## 1. Executive Summary

**Team Algebra Club Tracker** is a production-grade web platform for managing a lab/club's operations: projects, teams, members, tasks, attendance, meetings, documents, communication, and analytics. It provides role-based experiences for administrators, coordinators, project managers, team leaders, and members, with real-time collaboration, reporting, and auditability.

### 1.1 Problem Statement
Clubs and labs often manage work across spreadsheets, chat apps, and ad-hoc tools, leading to fragmented visibility into project progress, attendance, responsibilities, and institutional knowledge.

### 1.2 Solution
A unified, secure, role-aware platform that centralizes planning, execution, tracking, collaboration, and reporting with consistent workflows and actionable analytics.

---

## 2. Goals and Objectives

### 2.1 Product Goals
- **Centralize operations:** Single source of truth for projects, teams, members, tasks, meetings, attendance, and documents.
- **Improve accountability:** Clear ownership, progress tracking, approvals, and audit trails.
- **Enable collaboration:** Real-time communication, comments, mentions, announcements, and shared resources.
- **Provide insight:** Role-relevant dashboards and analytics for performance and health monitoring.
- **Ensure governance:** Robust RBAC, secure access, and auditable actions.

### 2.2 Success Metrics (Post-Launch Targets)
| Metric | Target |
|---|---|
| Active user adoption (eligible users logging in monthly) | ≥ 80% |
| Task status freshness (tasks updated within 7 days of activity) | ≥ 90% |
| Attendance recording compliance (sessions recorded) | ≥ 95% |
| On-time milestone visibility (milestones with tracked progress) | 100% |
| Critical audit coverage (create/update/delete/login events logged) | 100% |
| System availability (business hours) | ≥ 99.5% |
| P95 API response time for standard list/detail endpoints | < 500 ms (excluding heavy exports) |

---

## 3. Target Users and Personas

| Persona | Primary Goals | Key Needs |
|---|---|---|
| **Admin** | Govern the system | User/role/permission management, audit visibility, full control |
| **Coordinator** | Run club operations | Team/member management, announcements, meetings, attendance & leave oversight, analytics |
| **Project Manager** | Deliver projects | Plan/manage projects, milestones, tasks, progress, project analytics |
| **Team Leader** | Lead a team | Team task/attendance coordination, meeting minutes & action items, team leave approvals |
| **Member** | Contribute effectively | View/update assigned work, attendance, leave requests, documents, feedback, collaboration |

---

## 4. Scope

### 4.1 In Scope (v1)
- Web application (responsive: mobile, tablet, desktop) with dark/light mode
- Public marketing/informational pages and authenticated role-based application
- All modules listed in Section 7 (Auth through Audit)
- RBAC enforced at backend middleware, frontend route guards, and UI rendering
- Real-time chat/notifications/task updates via Socket.io
- PostgreSQL-backed persistence via Prisma, file uploads, email notifications, scheduled jobs
- Analytics dashboards, exports (CSV/PDF where specified), and audit logging
- Dockerized deployment (frontend, backend, postgres), documentation, seeds, and core tests

### 4.2 Out of Scope (v1, unless later approved)
- Native mobile apps (iOS/Android)
- External SSO/IdP integrations (SAML/OAuth providers beyond built-in auth)
- Advanced BI/warehouse pipelines
- Multi-tenancy across multiple independent clubs in one deployment
- Offline-first/PWA sync guarantees beyond standard web behavior

### 4.3 Assumptions
- Single club/lab deployment per environment (single-tenant).
- Users have modern browsers; low-end devices receive graceful fallbacks (e.g., non-3D hero).
- Email delivery depends on configured SMTP provider (Nodemailer).
- File storage uses local/server-mounted storage in v1 (`backend/uploads/`) with abstraction for future providers.

### 4.4 Constraints
- **Tech stack is fixed** (React 18+TS+Vite, Express+TS, Prisma+PostgreSQL, etc. as specified).
- **Folder structure must follow the provided tree exactly** (no renaming/skipping).
- All specified files must contain real, working code in implementation phases (no placeholders).

---

## 5. Roles, Permissions, and Access Control (RBAC)

### 5.1 Roles
1. **Admin**
2. **Coordinator**
3. **Project Manager**
4. **Team Leader**
5. **Member**

### 5.2 Permission Matrix (High-Level)

| Capability | Admin | Coordinator | Project Manager | Team Leader | Member |
|---|:---:|:---:|:---:|:---:|:---:|
| System/user/role/permission management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit log viewer (all, with filters) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage teams & members (global) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Announcements (create/manage, targeted) | ✅ | ✅ | ❌ | ❌ | View |
| Meetings (global management/scheduling oversight) | ✅ | ✅ | View (project-related) | Own team | View/participate |
| Attendance management & approvals/oversight | ✅ | ✅ | View (project/team context) | Own team | Own check-in/out & view |
| Leave approvals | ✅ | ✅ (global/assigned scope) | ❌ | Own team | Apply/view own |
| Projects & milestones CRUD/status/timeline | ✅ | View | ✅ | View (assigned) | View (assigned) |
| Tasks management (project/team scope) | ✅ | View | ✅ (project scope) | ✅ (own team) | Update assigned |
| Project/team/member analytics (broad) | ✅ | ✅ (all) | ✅ (project) | ✅ (own team) | Limited/personal |
| Documents (upload/manage/access by role) | ✅ | ✅ | ✅ (project scope) | ✅ (team scope) | ✅ (per access) |
| Knowledge base (create/manage content) | ✅ | ✅ | ✅ | ✅ | View/search (per access) |
| Communication (chat/channels) | ✅ | ✅ | ✅ | ✅ | ✅ (joined/team/project) |
| Achievements/feedback/leaderboard | ✅ | ✅ | ✅ | ✅ | ✅ |

> **Note:** Fine-grained permissions are managed via the Roles/Permissions modules and enforced consistently. "Own team"/"assigned" scopes are resolved server-side based on relationships.

### 5.3 RBAC Enforcement Layers (Mandatory)
1. **Backend middleware:** `role.middleware.ts` (and permission checks in services/controllers) on every protected endpoint.
2. **Frontend route guards:** `ProtectedRoute.tsx` and `RoleRoute.tsx` for authenticated and role-restricted navigation.
3. **UI-level conditional rendering:** hide/disable unauthorized actions and views in components/pages per role/permissions.

### 5.4 Role-Specific Dashboards
Each role has its own dashboard under `frontend/src/pages/<role>/` with relevant KPIs, quick actions, and recent activity:
- `pages/admin/` – system health, user/role stats, audit highlights
- `pages/coordinator/` – teams, attendance/leave queues, announcements, meetings, all-analytics overview
- `pages/project-manager/` – project health, milestones, task progress, burndown/progress views
- `pages/team-leader/` – team tasks, attendance, meeting actions, pending team leave
- `pages/member/` – assigned tasks, upcoming deadlines, attendance/leave status, notifications

---

## 6. User Experience & UI/UX Requirements

### 6.1 Design Principles
- Modern, clean, professional aesthetic with an **academic/tech** feel
- **Dark and light mode** support
- **Fully responsive** (mobile, tablet, desktop)
- Consistent spacing, typography, and component behavior (Tailwind CSS + shadcn/ui)

### 6.2 Global Application UX
- **App shell:** Sidebar + topbar layout, breadcrumbs
- **Global search / command palette:** `Ctrl+K`
- **Notification bell** with unread state and quick access
- **Profile menu** (profile, settings/preferences, change password, logout)
- **Animated preloader** (`components/preloader`) featuring the club logo
- **Loading & error states everywhere:** skeleton loaders, empty states, error boundaries
- **Accessibility:** WCAG AA, keyboard navigation, focus management, sufficient contrast, semantic markup/ARIA where needed

### 6.3 Public Pages (`pages/public/`)
- **Landing:** tasteful 3D hero (`components/three-d`) using lightweight model or animated geometry; **lazy-loaded** with **graceful fallback** on low-end devices; clear CTAs
- **About:** club/lab overview
- **Projects showcase:** public view of selected projects/achievements
- **Achievements:** highlights, badges/recognition
- **Contact:** contact information/form (as applicable)
- **Login/Register:** authentication entry points (register flow subject to configured policy/invite rules)

### 6.4 Reusable Components (Required)
- **DataTable:** sort, filter, paginate, export (CSV/PDF where applicable)
- **Forms:** React Hook Form + Zod validation, inline errors, accessible labels
- **Modals/dialogs, toasts**, **skeleton loaders**, **empty states**, **error boundaries**
- **Charts** (Recharts) for analytics visualizations
- **3D elements** via @react-three/fiber + drei (scoped and performance-conscious)

---

## 7. Functional Requirements by Module

Each backend module includes **routes, controller, service, repository, validation schema**; each frontend area includes matching **feature (API hooks, components)** and **pages** as applicable.

### 7.1 Auth
- Register, login, logout
- Refresh token flow (access + refresh tokens, **httpOnly cookies**)
- Forgot/reset password
- Change password
- Email verification
- Session/security handling aligned with backend standards

### 7.2 Users, Roles, Permissions
- Users CRUD, profile basics, activate/deactivate
- Roles CRUD and assignment to users
- Permissions CRUD/management and role-permission mapping
- Admin-only management interfaces and APIs (per RBAC)

### 7.3 Projects
- CRUD with status: **Planning / Active / On Hold / Completed**
- Deadlines, descriptions/metadata, assigned teams
- Project history timeline (`project-history`) for key changes/events

### 7.4 Teams and Team-Members
- Create/manage teams
- Assign team leader
- Add/remove members (`team-members` relationship management)

### 7.5 Members and Member-Skills
- Member profiles
- Skills with **proficiency levels**
- Search/filter members by skill and proficiency

### 7.6 Tasks and Task-Comments
- **Kanban board (drag and drop)** and **list view**
- Task fields: priority, status, due dates, assignees, subtasks (as modeled)
- Comments with **mentions**
- Real-time updates for relevant task changes

### 7.7 Milestones and Progress
- Milestone tracking per project
- **Progress percentage auto-calculated from tasks** (and/or milestone-task linkage as defined in TRD)
- Burndown/progress views for project tracking

### 7.8 Documents
- Upload/download/preview
- Versioning
- Folders/organization
- Access control by role and context (project/team/etc.)

### 7.9 Attendance
- Daily check-in/out
- Lab-session attendance
- Monthly calendar view
- Reports and **CSV/PDF export**

### 7.10 Leave
- Apply for leave
- Approve/reject with remarks
- Balance tracking
- Calendar overlay (personal/team/context views as permitted)

### 7.11 Meetings, Meeting-Minutes, Action-Items
- Schedule meetings, agenda
- Record meeting minutes
- **Action items convert to tasks**
- Reminders (in-app/email/jobs as applicable)

### 7.12 Communication
- Real-time **team chat and project channels** (Socket.io)
- Typing indicators, unread counts
- File sharing in conversations (subject to upload/security rules)

### 7.13 Announcements
- Create/manage announcements
- **Targeted by role or team**
- Pinned announcements
- Read receipts

### 7.14 Analytics
- Dashboards for: task completion, attendance rate, team performance, project health, member contribution
- Date filters and export capabilities
- Role-appropriate scope (all vs project vs team vs personal)

### 7.15 Knowledge Base
- Articles/resources with categories and tags
- Search
- Markdown editor for content authoring

### 7.16 Notifications
- In-app (real-time) and email notifications
- Mark read/unread (and bulk actions as appropriate)
- User notification preferences

### 7.17 Achievements and Feedback
- Badges/points for milestones/achievements
- Peer and leader feedback
- Leaderboard

### 7.18 Audit
- Log every **create/update/delete/login** with **user, IP, timestamp, and before/after values**
- **Admin-only** viewer with filters/search/pagination

---

## 8. Non-Functional Requirements

### 8.1 Security
- OWASP-aligned basics: input validation, sanitization, secure auth/session handling
- JWT access + refresh in **httpOnly cookies**, bcrypt password hashing
- Helmet, CORS whitelist, rate limiting
- File upload type/size limits and safe handling
- Least-privilege access via RBAC/permissions

### 8.2 Performance & Reliability
- Pagination, sorting, filtering on all list endpoints
- Efficient queries (indexes, selective includes) and sensible caching where appropriate
- Lazy-loading for heavy UI (e.g., 3D hero) and graceful degradation
- Background jobs for reminders/summaries/reports to avoid blocking requests

### 8.3 Scalability & Maintainability
- Layered backend architecture (route → controller → service → repository)
- Modular frontend features aligned to domains
- Shared/consistent types and validation patterns where feasible

### 8.4 Observability & Auditability
- Structured error handling and consistent API responses
- Comprehensive audit logging for governed actions
- Operational logs sufficient for debugging (without leaking secrets)

### 8.5 Compatibility & Accessibility
- Responsive layouts across common device sizes
- WCAG AA and keyboard navigation support

---

## 9. Data & Reporting Requirements
- **Primary datastore:** PostgreSQL via Prisma ORM
- **Core entities:** cover all modules with proper relations, enums, indexes, unique constraints, soft deletes where sensible, and `createdAt/updatedAt`
- **Seed data:** 1 admin, 1 coordinator, 2 project managers, 3 team leaders, 15 members, sample projects, tasks, attendance, meetings, announcements
- **Exports:** CSV/PDF for attendance/reports and table exports where specified
- **Database design docs:** `database/design/database-erd.md` (Mermaid ERD) and `database/design/relationships.md`

---

## 10. Integrations & System Interfaces
- **Real-time:** Socket.io (chat, notifications, task updates)
- **Email:** Nodemailer (verification/reset, reminders, summaries/reports)
- **Scheduling:** node-cron jobs (deadline reminders, daily attendance summary, weekly report email)
- **File handling:** Multer uploads, preview/download services

---

## 11. Release Plan (Phased)

> Build in phases. After each phase, deliver: created artifacts, run instructions, and next steps. No TODOs or mock-data substitutes for real logic.

| Phase | Focus | Key Outcomes / Exit Criteria |
|---|---|---|
| **0. Foundations** | Repo/tooling/Docker/env | Docker-compose runs frontend, backend, postgres; lint/format/test scaffolding; `.env.example`; base docs skeleton |
| **1. Core Platform & Auth** | Prisma schema base, auth, RBAC plumbing | Migrations+seed base; register/login/refresh/logout/password flows/email verification; role/permission enforcement across layers; base layout & guards |
| **2. Org & Project Structure** | Users/Roles/Permissions, Teams/Members/Skills, Projects | CRUD + relationships; admin/coordinator/PM views; project history timeline |
| **3. Work Management** | Tasks, Comments, Milestones, Progress | Kanban+list, comments/mentions, milestones, auto-calculated progress, burndown view |
| **4. Operations Modules** | Attendance, Leave, Meetings/Minutes/Action Items, Documents | Check-in/out & calendar & reports/exports; leave workflows & balances; meetings to action-items-to-tasks; uploads/versioning/access |
| **5. Collaboration & Knowledge** | Communication, Announcements, Knowledge, Notifications | Socket.io chat/channels, announcements with targeting/read receipts, knowledge base w/ markdown & search, in-app/email notifications & prefs |
| **6. Insights, Gamification & Audit** | Analytics, Achievements/Feedback, Audit, Jobs | Role-scoped dashboards/exports; badges/points/leaderboard/feedback; full audit log + admin viewer; cron jobs operational |
| **7. Hardening & Launch** | UI polish, a11y, tests, docs | Public pages incl. 3D hero fallback/preloader; WCAG AA pass; core unit & API integration tests; complete docs & Swagger/OpenAPI; production-ready configs |

---

## 12. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| RBAC complexity/scope leaks | Unauthorized access | Centralize permission checks server-side; test guards; audit sensitive actions |
| Real-time/event consistency | Stale UI or missed updates | Well-defined socket events, reconnection handling, query invalidation via TanStack Query |
| File handling/security | Data leaks or unsafe uploads | Strict MIME/size validation, storage isolation, access checks, safe preview paths |
| 3D/performance on low-end devices | Poor landing performance | Lazy-load, lightweight assets, feature detection/fallback UI |
| Data model churn across modules | Migration/rework cost | Design comprehensive Prisma schema early (Phase 1) with reviews before broad feature build-out |
| Email/job reliability | Missed reminders/reports | Config validation, retry/logging strategy, admin visibility into job outcomes (as feasible) |

---

## 13. Acceptance Criteria (v1)
- All modules in Section 7 implemented with real working logic and consistent types/imports
- RBAC enforced in backend middleware, frontend route guards, and UI conditional rendering
- Role-specific dashboards available under `pages/admin|coordinator|project-manager|team-leader|member`
- Prisma schema covers all modules with relations/enums/indexes/constraints/soft deletes/timestamps; seeds and DB docs provided
- Docker Compose runs full stack (frontend, backend, postgres) with documented setup
- Public pages, responsive UI, dark/light mode, preloader, and lazy-loaded 3D hero with fallback delivered
- Core services/auth unit tests and selected API integration tests pass
- Required documentation completed (`README.md`, `docs/*` including API documentation/Swagger/OpenAPI)
