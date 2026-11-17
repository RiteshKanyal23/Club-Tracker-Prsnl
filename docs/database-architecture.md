# Database Architecture
PostgreSQL managed via Prisma.

## Phase 1 updates (Core Platform & Auth/RBAC foundation)
- **Auth tokens:** `RefreshToken` (hashed, expiring, revocable) and `AuthToken` (typed: email verification/password reset, hashed, expiring, single-use)
- **RBAC models:** `Role`, `Permission`, `RolePermission` (M:N), `UserRole` (M:N) alongside `User.role` enum for primary role checks
- **User fields:** email uniqueness, `passwordHash`, `isActive`, `emailVerified`, soft-delete (`deletedAt`), timestamps
- **Indexes/constraints:** unique token hashes/keys, FK indexes for token and role/permission joins

## Seed
`backend/prisma/seed.ts` provisions base roles (ADMIN/COORDINATOR/PROJECT_MANAGER/TEAM_LEADER/MEMBER), demo users per role (with verified active accounts), sample project/task/attendance/meeting/announcement.

## Phase 2 updates (Org & Project Structure)
- **Project:** indexes on `(status, deadline)`; `ProjectHistory` model (`projectId`, `actorId`, `action`, `details`, `createdAt`) for timeline tracking.
- **MemberSkill:** `@@unique([memberId, name])`, indexes for search/filter by name/proficiency.
- Existing relations used: `Team`/`TeamMember`/`Member`, `Project`/`ProjectTeam`, member profiles and skills.

## Phase 3 updates (Work Management)
- **Task:** added `milestoneId`, `parentId` (self-relation for subtasks), `order` (kanban), relations to milestone/subtasks; indexes for `(projectId,status,order)`, `milestoneId`, `parentId`.
- **TaskComment:** added `mentions` (string array), `updatedAt`, cascade on task delete, index on `(taskId, createdAt)`.
- **Milestone:** added `description`, `deletedAt`, relation to tasks, index on `(projectId, dueDate)`; progress computed from linked tasks.
- **Progress:** derived dynamically from tasks/milestones (no separate persisted progress table required for current calculations).

## Phase 4 updates (Operations Modules)
- **Attendance:** `AttendanceRecord` extended with `sessionName`, `notes`, `updatedAt`, cascade/indexes for member/date/session queries.
- **Leave:** `LeaveRequest` extended with `approvedBy` and indexes; added `LeaveBalance` (per member/year total/used) for balance tracking.
- **Meetings:** `Meeting` extended with `location/teamId/projectId/createdBy`; added `MeetingMinutes` (1:1) and `ActionItem` (with status, assignee/due, optional `taskId` link for conversion) with indexes.
- **Documents:** added `DocumentFolder` (hierarchy), `Document` (metadata, `accessRoles`, project/team/folder, soft delete), and `DocumentVersion` (versioned file metadata/path/size/mime, unique per document+version).

## Phase 5 updates (Collaboration & Knowledge)
- **Communication:** `Channel` (`TEAM|PROJECT|GENERAL`, optional team/project links) with `ChannelMember` (membership + `lastReadAt` for unread tracking) and `Message` (sender, content, optional file metadata/path/mime, timestamps); indexes for channel queries and message timelines.
- **Announcements:** extended with targeting (`targetRoles[]`, `targetTeams[]`, `createdBy`) and `AnnouncementReceipt` (per-user read receipts, unique per announcement/user).
- **Knowledge:** `KnowledgeArticle` with markdown `content`, `category`, `tags[]`, `published`, `authorId`, timestamps and category index for browse/search.
- **Notifications:** `Notification` (`type`, title/body/data, read/emailed timestamps, user FK, indexes) and `NotificationPreference` (in-app/email and category toggles, per-user unique) with User relations.

## Phase 6 updates (Analytics, Achievements, Feedback, Audit UX)
- **Achievements:** `Achievement` catalog (name/description/criteria/icon/points) and `MemberAchievement` awards (member/achievement/awardedBy/note/awardedAt) with uniqueness per member+achievement and relations to members.
- **Feedback:** `Feedback` (from/to users, optional project/task, rating/comment, `OPEN|REVIEWED|RESOLVED` status, response/reviewer metadata, timestamps) with indexes for common lookups.
- **Audit:** `AuditLog` (existing) now surfaced via filterable/paginated API and CSV export (actor/action/entity/before-after/ip/timestamps).
- **Analytics:** computed from existing domain data (projects/tasks, assignments/workload, attendance/leave, trends) without additional persisted analytics tables.

## Notes
- Run `npx prisma migrate dev` after schema changes and `npx prisma db seed` to load demo data (Phase 6 adds achievement/feedback models; use e.g. `--name phase6_insights_feedback_audit`).
- Realtime collaboration uses Socket.io rooms: `user:<id>`, `project:<id>`, `channel:<id>` with events for messages/typing and `notification:new`.
- Audit logging hooks are instrumented (best-effort) for key actions including auth events, user/project/task management, leave workflows, document operations, announcements/knowledge/feedback changes, and other core flows; continue expanding coverage and capturing request metadata (e.g. IP) where needed.
- Continue hardening: finer-grained RBAC/permission checks, validation/pagination consistency, automated tests, and Swagger/OpenAPI generation.
