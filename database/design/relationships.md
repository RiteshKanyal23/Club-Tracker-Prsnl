# Database Relationships (Phase 0 Base)

- **User 1—1 Member (optional):** members/leaders have member profiles linked to user accounts.
- **Team M—N Member:** via `TeamMember` join table.
- **Project M—N Team:** via `ProjectTeam` join table.
- **Project 1—N Task/Milestone:** tasks and milestones belong to a project.
- **Task M—N Member:** via `TaskAssignee` for assignments.
- **Task 1—N TaskComment:** comments belong to tasks.
- **Member 1—N MemberSkill/AttendanceRecord/LeaveRequest:** member-owned records.
- **User 1—N AuditLog:** actor relation for auditable actions.

Full relationship definitions, constraints, indexes, and soft-delete rules for all modules will be documented and implemented in Phase 1+ per TRD.
