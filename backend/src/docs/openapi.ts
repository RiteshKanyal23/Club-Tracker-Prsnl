export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Team Algebra Club Tracker API",
    version: "1.0.0",
    description:
      "REST API for Team Algebra Club Tracker. Base path: /api/v1. Most endpoints require authentication (httpOnly access token cookie or Bearer token). Responses follow a standard envelope: { success, data, message, errors }. RBAC is enforced per endpoint/module.",
  },
  servers: [{ url: "/api/v1", description: "API v1" }],
  tags: [
    { name: "Health" }, { name: "Auth" }, { name: "Users" }, { name: "Roles" }, { name: "Permissions" },
    { name: "Projects" }, { name: "Teams" }, { name: "Team Members" }, { name: "Members" }, { name: "Member Skills" },
    { name: "Tasks" }, { name: "Task Comments" }, { name: "Milestones" }, { name: "Progress" }, { name: "Project History" },
    { name: "Documents" }, { name: "Attendance" }, { name: "Leave" }, { name: "Meetings" }, { name: "Meeting Minutes" },
    { name: "Action Items" }, { name: "Communication" }, { name: "Announcements" }, { name: "Analytics" },
    { name: "Knowledge" }, { name: "Notifications" }, { name: "Achievements" }, { name: "Feedback" }, { name: "Audit" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "accessToken", description: "JWT access token in httpOnly cookie (set on login/register/refresh)." },
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "JWT access token in Authorization header." },
    },
    schemas: {
      ApiEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { nullable: true },
          message: { type: "string", nullable: true },
          errors: { nullable: true },
        },
      },
      ErrorEnvelope: {
        allOf: [{ $ref: "#/components/schemas/ApiEnvelope" }],
        example: { success: false, data: null, message: "Validation failed", errors: { fieldErrors: {} } },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" }, totalPages: { type: "integer" },
        },
      },
      PaginatedEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              items: { type: "array", items: { type: "object", additionalProperties: true } },
              pagination: { $ref: "#/components/schemas/Pagination" },
            },
          },
          message: { type: "string", nullable: true },
          errors: { nullable: true },
        },
      },
      LoginRequest: {
        type: "object", required: ["email", "password"],
        properties: { email: { type: "string", format: "email" }, password: { type: "string" } },
      },
      RegisterRequest: {
        type: "object", required: ["name", "email", "password"],
        properties: { name: { type: "string", minLength: 2 }, email: { type: "string", format: "email" }, password: { type: "string", minLength: 8 } },
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  paths: {
    "/health": {
      get: { tags: ["Health"], summary: "Health check", security: [], responses: { "200": { description: "Service healthy", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiEnvelope" } } } } } },
    },
    "/auth/register": { post: { tags: ["Auth"], summary: "Register (sets auth cookies)", security: [], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } } }, responses: { "201": { description: "Registered" }, "400": { description: "Validation error" }, "409": { description: "Conflict" } } } },
    "/auth/login": { post: { tags: ["Auth"], summary: "Login (sets auth cookies)", security: [], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } }, responses: { "200": { description: "Logged in" }, "401": { description: "Invalid credentials" } } } },
    "/auth/logout": { post: { tags: ["Auth"], summary: "Logout and clear cookies", responses: { "200": { description: "Logged out" } } } },
    "/auth/refresh": { post: { tags: ["Auth"], summary: "Refresh tokens (rotates refresh token cookie)", security: [], responses: { "200": { description: "Refreshed" }, "401": { description: "Unauthorized" } } } },
    "/auth/me": { get: { tags: ["Auth"], summary: "Get current authenticated user", responses: { "200": { description: "Current user" }, "401": { description: "Unauthorized" } } } },
    "/auth/forgot-password": { post: { tags: ["Auth"], summary: "Request password reset", security: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { email: { type: "string", format: "email" } }, required: ["email"] } } } }, responses: { "200": { description: "Reset requested" } } } },
    "/auth/reset-password": { post: { tags: ["Auth"], summary: "Reset password with token", security: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { token: { type: "string" }, password: { type: "string", minLength: 8 } }, required: ["token","password"] } } } }, responses: { "200": { description: "Password reset" } } } },
    "/auth/change-password": { post: { tags: ["Auth"], summary: "Change password (authenticated)", requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { currentPassword: { type: "string" }, newPassword: { type: "string", minLength: 8 } }, required: ["currentPassword","newPassword"] } } } }, responses: { "200": { description: "Password changed" } } } },
    "/auth/verify-email": { post: { tags: ["Auth"], summary: "Verify email with token", security: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { token: { type: "string" } }, required: ["token"] } } } }, responses: { "200": { description: "Email verified" } } } },
    "/users": {
      get: { tags: ["Users"], summary: "List users (RBAC)", responses: { "200": { description: "Users list" } } },
      post: { tags: ["Users"], summary: "Create user (RBAC)", requestBody: { required: true, content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, responses: { "201": { description: "Created" } } },
    },
    "/users/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      get: { tags: ["Users"], summary: "Get user by id", responses: { "200": { description: "User" }, "404": { description: "Not found" } } },
      put: { tags: ["Users"], summary: "Update user", requestBody: { content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Users"], summary: "Delete/disable user", responses: { "200": { description: "Deleted" } } },
    },
    "/users/{id}/activate": { post: { tags: ["Users"], summary: "Activate user", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Activated" } } } },
    "/users/{id}/deactivate": { post: { tags: ["Users"], summary: "Deactivate user", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deactivated" } } } },
    "/users/{id}/role": { post: { tags: ["Users"], summary: "Assign role to user", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { role: { type: "string" } } } } } }, responses: { "200": { description: "Role assigned" } } } },
    "/projects": {
      get: { tags: ["Projects"], summary: "List projects", responses: { "200": { description: "Projects list (paginated)" } } },
      post: { tags: ["Projects"], summary: "Create project (RBAC)", requestBody: { required: true, content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, responses: { "201": { description: "Created" } } },
    },
    "/projects/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      get: { tags: ["Projects"], summary: "Get project", responses: { "200": { description: "Project" } } },
      put: { tags: ["Projects"], summary: "Update project (RBAC)", requestBody: { content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Projects"], summary: "Delete project (RBAC)", responses: { "200": { description: "Deleted" } } },
    },
    "/tasks": {
      get: { tags: ["Tasks"], summary: "List tasks", responses: { "200": { description: "Tasks list" } } },
      post: { tags: ["Tasks"], summary: "Create task", requestBody: { content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, responses: { "201": { description: "Created" } } },
    },
    "/tasks/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      get: { tags: ["Tasks"], summary: "Get task", responses: { "200": { description: "Task" } } },
      put: { tags: ["Tasks"], summary: "Update task", requestBody: { content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Tasks"], summary: "Delete task", responses: { "200": { description: "Deleted" } } },
    },
    "/tasks/{id}/move": { post: { tags: ["Tasks"], summary: "Move task (status/order)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, responses: { "200": { description: "Moved" } } } },
    "/analytics/overview": { get: { tags: ["Analytics"], summary: "Analytics overview (RBAC)", responses: { "200": { description: "Overview metrics" } } } },
    "/audit": { get: { tags: ["Audit"], summary: "List audit logs (Admin/Coordinator)", parameters: [{ name: "limit", in: "query", schema: { type: "integer" } }, { name: "page", in: "query", schema: { type: "integer" } }, { name: "action", in: "query", schema: { type: "string" } }, { name: "entityType", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Audit log entries" } } } },
    "/audit/export/csv": { get: { tags: ["Audit"], summary: "Export audit logs as CSV (Admin/Coordinator)", responses: { "200": { description: "CSV file", content: { "text/csv": { schema: { type: "string", format: "binary" } } } } } } },
  },
} as const;

function crud(tag: string, base: string, idParam = "id") {
  const p: any = (openApiSpec as any).paths;
  p[base] = p[base] || {
    get: { tags: [tag], summary: `List ${tag.toLowerCase()}`, responses: { "200": { description: "List" } } },
    post: { tags: [tag], summary: `Create ${tag.toLowerCase().replace(/s$/,"")}`, requestBody: { content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, responses: { "201": { description: "Created" } } },
  };
  p[`${base}/{${idParam}}`] = p[`${base}/{${idParam}}`] || {
    parameters: [{ name: idParam, in: "path", required: true, schema: { type: "string" } }],
    get: { tags: [tag], summary: `Get ${tag.toLowerCase().replace(/s$/,"")}`, responses: { "200": { description: "Detail" }, "404": { description: "Not found" } } },
    put: { tags: [tag], summary: `Update ${tag.toLowerCase().replace(/s$/,"")}`, requestBody: { content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, responses: { "200": { description: "Updated" } } },
    delete: { tags: [tag], summary: `Delete ${tag.toLowerCase().replace(/s$/,"")}`, responses: { "200": { description: "Deleted" } } },
  };
}

// Add generic CRUD coverage for remaining mounted resources
crud("Roles", "/roles");
crud("Permissions", "/permissions");
crud("Teams", "/teams");
crud("Team Members", "/team-members");
crud("Members", "/members");
crud("Member Skills", "/member-skills");
crud("Task Comments", "/task-comments");
crud("Milestones", "/milestones");
crud("Project History", "/project-history");
crud("Documents", "/documents");
crud("Attendance", "/attendance");
crud("Leave", "/leave");
crud("Meetings", "/meetings");
crud("Meeting Minutes", "/meeting-minutes");
crud("Action Items", "/action-items");
crud("Communication", "/communication");
crud("Announcements", "/announcements");
crud("Knowledge", "/knowledge");
crud("Notifications", "/notifications");
crud("Achievements", "/achievements");
crud("Feedback", "/feedback");

// Extra common endpoints (best-effort documentation)
const p: any = (openApiSpec as any).paths;
p["/attendance/check-in"] = { post: { tags: ["Attendance"], summary: "Check in", requestBody: { content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, responses: { "201": { description: "Checked in" } } } };
p["/attendance/check-out/{id}"] = { post: { tags: ["Attendance"], summary: "Check out", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Checked out" } } } };
p["/attendance/report"] = { get: { tags: ["Attendance"], summary: "Attendance report", responses: { "200": { description: "Report" } } } };
p["/attendance/export/csv"] = { get: { tags: ["Attendance"], summary: "Export attendance CSV", responses: { "200": { description: "CSV" } } } };
p["/leave/apply"] = { post: { tags: ["Leave"], summary: "Apply for leave", requestBody: { content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, responses: { "201": { description: "Applied" } } } };
p["/leave/{id}/review"] = { post: { tags: ["Leave"], summary: "Review leave request", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["APPROVED","REJECTED"] }, remarks: { type: "string" } } } } } }, responses: { "200": { description: "Reviewed" } } } };
p["/action-items/{id}/convert"] = { post: { tags: ["Action Items"], summary: "Convert action item to task", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { projectId: { type: "string" } }, required: ["projectId"] } } } }, responses: { "200": { description: "Converted" } } } };
p["/progress"] = { get: { tags: ["Progress"], summary: "Get progress metrics", responses: { "200": { description: "Progress" } } } };
p["/notifications/preferences"] = { get: { tags: ["Notifications"], summary: "Get notification preferences", responses: { "200": { description: "Preferences" } } }, put: { tags: ["Notifications"], summary: "Update notification preferences", requestBody: { content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, responses: { "200": { description: "Updated" } } } };
p["/achievements/award"] = { post: { tags: ["Achievements"], summary: "Award achievement to member", requestBody: { content: { "application/json": { schema: { type: "object", additionalProperties: true } } } }, responses: { "201": { description: "Awarded" } } } };
p["/achievements/evaluate"] = { post: { tags: ["Achievements"], summary: "Evaluate and auto-award achievements for member", requestBody: { content: { "application/json": { schema: { type: "object", properties: { memberId: { type: "string" } } } } } }, responses: { "200": { description: "Evaluated" } } } };