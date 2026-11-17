# API Documentation
Base URL: `/api/v1`  
Standard response: `{ success, data, message, errors }`

## Auth (`/auth`)
- `POST /auth/register` — `{ name, email, password }` → creates user, issues access+refresh httpOnly cookies, sends verification token (email/mock)
- `POST /auth/login` — `{ email, password }` → issues cookies, returns user
- `POST /auth/logout` — revokes refresh token (if present) and clears cookies
- `POST /auth/refresh` — rotates refresh token via cookie and issues new cookies
- `POST /auth/forgot-password` — `{ email }` → sends reset token (email/mock)
- `POST /auth/reset-password` — `{ token, password }` → resets password and revokes refresh tokens
- `POST /auth/change-password` — **auth required** `{ currentPassword, newPassword }`
- `POST /auth/verify-email` — `{ token }`
- `GET /auth/me` — **auth required** → current user

## Users (`/users`) — **Admin only**
- `GET /users`, `GET /users/:id`
- `POST /users` — `{ name, email, password, role? }`
- `PUT /users/:id` — `{ name?, email?, role?, isActive? }`
- `DELETE /users/:id` — soft delete/deactivate
- `PATCH /users/:id/activate`, `PATCH /users/:id/deactivate`
- `PATCH /users/:id/role` — `{ role }`

## Roles (`/roles`) — **Admin only**
- `GET /roles`, `GET /roles/:id`
- `POST /roles` — `{ name, description? }`
- `PUT /roles/:id` — `{ name?, description? }`
- `DELETE /roles/:id`
- `PUT /roles/:id/permissions` — `{ permissionIds: string[] }`

## Permissions (`/permissions`) — **Admin only**
- `GET /permissions`, `GET /permissions/:id`
- `POST /permissions` — `{ key, description? }`
- `PUT /permissions/:id` — `{ key?, description? }`
- `DELETE /permissions/:id`

## Projects (`/projects`) — **auth required** (create/update/delete: Admin, Project Manager)
- `GET /projects` — list with pagination/filter (`page, limit, status, search`)
- `GET /projects/:id` — detail with assigned teams and recent history
- `POST /projects` — `{ name, description?, status?, deadline?, teamIds? }` (auto-logs history)
- `PUT /projects/:id` — update fields/team assignments (auto-logs history)
- `DELETE /projects/:id` — soft delete (auto-logs history)

## Project History (`/project-history`) — **auth required**
- `GET /project-history?projectId=...` — timeline entries
- `GET /project-history/:id` — entry detail

## Teams (`/teams`) — **auth required** (manage: Admin, Coordinator)
- `GET /teams`, `GET /teams/:id`
- `POST /teams` — `{ name, description?, leaderId? }`
- `PUT /teams/:id`, `DELETE /teams/:id`

## Team Members (`/team-members`) — **auth required** (manage: Admin, Coordinator)
- `GET /team-members?teamId=&memberId=`
- `GET /team-members/:id`
- `POST /team-members` — `{ teamId, memberId }`
- `DELETE /team-members/:id`

## Members (`/members`) — **auth required** (manage: Admin, Coordinator)
- `GET /members` — pagination/filter (`page, limit, search, skill, minProficiency`)
- `GET /members/:id`
- `POST /members` — `{ userId, bio? }`
- `PUT /members/:id`, `DELETE /members/:id`

## Member Skills (`/member-skills`) — **auth required** (manage: Admin, Coordinator)
- `GET /member-skills?memberId=&name=`
- `GET /member-skills/:id`
- `POST /member-skills` — `{ memberId, name, proficiency(1-5) }`
- `PUT /member-skills/:id`, `DELETE /member-skills/:id`

## Tasks (`/tasks`) — **auth required** (create/delete: Admin, Coordinator, PM, Team Leader)
- `GET /tasks` — list/filter (`projectId, status, milestoneId, parentId, root=true, assigneeId, search, page, limit`)
- `GET /tasks/:id`, `POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`
- `PATCH /tasks/:id/move` — `{ status, order? }` (Kanban moves)
- Fields: `projectId, milestoneId?, parentId? (subtasks), title, description?, status, priority, dueDate?, order, assigneeIds[]`
- Emits socket events to project room: `task:created`, `task:updated`, `task:deleted`

## Task Comments (`/task-comments`) — **auth required**
- `GET /task-comments?taskId=`, `GET /:id`, `POST /` (`{ taskId, content, mentions[] }`), `PUT /:id`, `DELETE /:id`
- Emits: `task:commented`, `task:commentDeleted`

## Milestones (`/milestones`) — **auth required** (manage: Admin, PM)
- `GET /milestones?projectId=`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- Response includes computed progress from linked tasks.

## Progress (`/progress`) — **auth required**
- `GET /progress?projectId=...` or `GET /progress/:projectId`
- Returns auto-calculated project progress (done/total/percent/byStatus), milestone progress, and burndown data.

## Attendance (`/attendance`) — **auth required**
- `GET /attendance` — list/filter (`memberId, from, to, month, year, sessionName, page, limit`)
- `GET /attendance/report` — summary + items (Admin/Coordinator/Team Leader)
- `GET /attendance/export/csv` — CSV export (Admin/Coordinator/Team Leader)
- `POST /attendance/check-in` — `{ memberId, sessionName?, date?, notes? }`
- `POST /attendance/:id/check-out` — record checkout
- `POST/PUT/DELETE /attendance[/:id]` — managed records (role-scoped)

## Leave (`/leave`) — **auth required**
- `GET /leave`, `GET /leave/:id`, `GET /leave/calendar`, `GET /leave/balance?memberId=`
- `POST /leave` — apply `{ memberId, startDate, endDate, reason }`
- `POST /leave/:id/review` — `{ status: APPROVED|REJECTED, remarks? }` (Admin/Coordinator/Team Leader); approved leave increments used balance
- `POST /leave/balance` — set/update balance (Admin/Coordinator)

## Meetings (`/meetings`) — **auth required** (manage: Admin/Coordinator/PM/Team Leader)
- CRUD: `GET/POST /meetings`, `GET/PUT/DELETE /meetings/:id`
- Includes minutes and action items in detail/list responses

## Meeting Minutes (`/meeting-minutes`) — **auth required**
- `GET /meeting-minutes?meetingId=`
- `POST /meeting-minutes` — upsert `{ meetingId, content }` (manage roles)

## Action Items (`/action-items`) — **auth required**
- CRUD: `GET/POST /action-items`, `GET/PUT/DELETE /action-items/:id` (filter by `meetingId`)
- `POST /action-items/:id/convert-to-task` — `{ projectId }` creates a task and links it to the action item

## Documents (`/documents`) — **auth required**
- Folders: `GET/POST /documents/folders`, `GET/DELETE /documents/folders/:id`
- Documents: `GET /documents`, `GET /documents/:id`, `POST /documents` (multipart `file` + fields), `POST /documents/:id/versions` (multipart `file`), `DELETE /documents/:id`
- Download/preview: `GET /documents/:id/download` or `GET /documents/download?documentId=&versionId=`
- Supports folders, metadata, role/access fields, and file versioning (Multer storage)

## Communication (`/communication`) — **auth required**
- `GET /communication/channels` — list channels for current user (includes last message + unread count)
- `POST /communication/channels` — create channel `{ name, type: TEAM|PROJECT|GENERAL, teamId?, projectId? }` (creator auto-joined)
- `GET /communication/channels/:id` — channel detail (members; membership required)
- `POST /communication/channels/:id/join` — join channel
- `POST /communication/channels/:id/read` — mark channel messages read (updates `lastReadAt`)
- `GET /communication/channels/:id/messages` — list messages
- `POST /communication/channels/:id/messages` — send message (multipart: `content` and/or `file`); stores file metadata/path and emits realtime `message:new` to channel room
- Realtime (Socket.io): `join:user`, `join:channel`/`leave:channel`, `typing` (broadcast to channel), server emits `message:new`

## Announcements (`/announcements`) — **auth required**
- `GET /announcements`, `GET /announcements/:id` — list/detail (includes receipts)
- `POST /announcements` — create `{ title, content, pinned?, targetRoles?, targetTeams? }` (Admin/Coordinator)
- `PUT /announcements/:id`, `DELETE /announcements/:id` (Admin/Coordinator)
- `POST /announcements/:id/read` — mark read (receipt per user)

## Knowledge (`/knowledge`) — **auth required**
- `GET /knowledge` — list/search (`search`, `category`, `tag`, `published`)
- `GET /knowledge/:id`, `POST /knowledge`, `PUT /knowledge/:id`, `DELETE /knowledge/:id`
- Article fields: `title`, `content` (markdown), `category`, `tags[]`, `published`, author metadata

## Notifications (`/notifications`) — **auth required**
- `GET /notifications` — list current user's notifications (`unread=true`, `limit`)
- `GET /notifications/:id`, `POST /notifications/:id/read`, `POST /notifications/read-all`
- `GET /notifications/preferences`, `PUT /notifications/preferences` — in-app/email and category preferences
- `POST /notifications` — create/send notification (Admin/Coordinator); emits realtime `notification:new` to user room and best-effort email per preferences
- Types: `INFO|TASK|MEETING|LEAVE|ANNOUNCEMENT|SYSTEM`

## Analytics (`/analytics`) — **auth required**
- `GET /analytics/overview` — totals and distributions (users/projects/tasks/teams/meetings/open leaves, tasks/projects by status, recent attendance summary)
- `GET /analytics/workload` — member workload (active/done/total assigned tasks) and team workload aggregates
- `GET /analytics/trends?days=14` — daily trend series for recent attendance, tasks completed, and leave requests

## Achievements (`/achievements`) — **auth required**
- `GET /achievements` — achievement catalog (with award counts)
- `GET /achievements/:id` — achievement detail + awards
- `GET /achievements/awards` — awards list (filter `memberId`, `achievementId`)
- `POST /achievements` / `PUT /achievements/:id` / `DELETE /achievements/:id` — manage catalog (Admin/Coordinator)
- `POST /achievements/award` — manually award `{ memberId, achievementId, note? }` (Admin/Coordinator/Team Leader)
- `POST /achievements/evaluate` — evaluate/auto-award basic criteria for `{ memberId }` (Admin/Coordinator/Team Leader)

## Feedback (`/feedback`) — **auth required**
- `GET /feedback` — list feedback (members see own given/received; managers can view broader sets; filters `projectId`, `toUserId`, `status`)
- `GET /feedback/:id`
- `POST /feedback` — submit `{ toUserId?, projectId?, taskId?, rating?, comment }`
- `PUT /feedback/:id` — update/respond/status (`OPEN|REVIEWED|RESOLVED`, `response`, etc.) with role/ownership checks
- `DELETE /feedback/:id` — remove (owner or Admin/Coordinator)

## Audit (`/audit`) — **auth required** (Admin/Coordinator)
- `GET /audit` — paginated/filterable audit logs (`entityType`, `entityId`, `actorId`, `action`, `from`, `to`, `page`, `limit`)
- `GET /audit/:id` — audit log detail
- `GET /audit/export/csv` — export filtered logs as CSV

## OpenAPI / Swagger
- `GET /api/v1/openapi.json` — OpenAPI 3.0 specification (machine-readable)
- `GET /api/v1/docs` — Swagger UI (interactive API docs, loads spec from `/api/v1/openapi.json`)
- Spec includes base path, security schemes (cookie/bearer JWT), standard response envelope schemas, and documented paths for core and mounted module endpoints (RBAC/auth requirements noted at high level; see route/middleware for exact enforcement).

## Testing & hardening notes
- Backend automated tests run with **Vitest + Supertest** (`cd backend && npm test`). Existing tests cover health, OpenAPI/docs, validation envelopes, auth/RBAC behavior, and workflow smoke tests (some integration cases rely on seeded users and a reachable database via `backend/.env`).
- **Pagination:** shared `validatePagination` middleware normalizes `page`/`limit` with sane defaults and caps (e.g. projects/tasks lists) and is applied where added; extend similarly to other list endpoints for consistency.
- RBAC middleware normalizes role comparisons (case-insensitive). Continue applying least-privilege `requireRoles`/permission checks per endpoint and expanding integration coverage.
- Remaining follow-ups (documented): broader per-endpoint RBAC/permission hardening, consistent pagination/validation across all list routes, more CRUD/workflow integration tests with data cleanup, frontend unit/E2E tests, and expanded audit metadata where needed.

> Full Swagger/OpenAPI to be generated in later phases.
