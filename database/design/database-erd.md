# Database ERD

```mermaid
erDiagram
  User ||--o| Member : has
  Member ||--o{ TeamMember : joins
  Team ||--o{ TeamMember : includes
  Team ||--o{ ProjectTeam : assigned
  Project ||--o{ ProjectTeam : has
  Project ||--o{ Task : contains
  Project ||--o{ Milestone : has
  Task ||--o{ TaskAssignee : assigned
  Member ||--o{ TaskAssignee : works_on
  Task ||--o{ TaskComment : has
  Member ||--o{ MemberSkill : has
  Member ||--o{ AttendanceRecord : records
  Member ||--o{ LeaveRequest : submits
  User ||--o{ AuditLog : acts
```

> Phase 0 base ERD. Full module coverage (documents, meetings/minutes/action-items, communication, announcements targets/receipts, knowledge, notifications/preferences, achievements/feedback, permissions mappings, project history, progress entities, etc.) will be expanded in Phase 1+.
