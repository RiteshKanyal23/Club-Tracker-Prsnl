-- CreateEnum
CREATE TYPE "TeamCategory" AS ENUM ('FRONTEND', 'BACKEND', 'DATABASE');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterEnum
ALTER TYPE "RoleName" ADD VALUE 'CEO';

-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN     "assignmentId" TEXT,
ADD COLUMN     "designationId" TEXT,
ADD COLUMN     "designationName" TEXT,
ADD COLUMN     "memberIdText" TEXT,
ADD COLUMN     "memberName" TEXT,
ADD COLUMN     "projectManagerName" TEXT,
ADD COLUMN     "projectName" TEXT,
ADD COLUMN     "teamLeadName" TEXT,
ADD COLUMN     "teamName" TEXT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "joiningDate" TIMESTAMP(3),
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "orgSlot" INTEGER;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "category" "TeamCategory",
ADD COLUMN     "leaderMemberId" TEXT,
ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ceoSlot" TEXT;

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgAssignment" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "designationId" TEXT NOT NULL,
    "projectId" TEXT,
    "teamId" TEXT,
    "teamLeadId" TEXT,
    "projectManagerId" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "activeKey" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Designation_key_key" ON "Designation"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Designation_name_key" ON "Designation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OrgAssignment_activeKey_key" ON "OrgAssignment"("activeKey");

-- CreateIndex
CREATE INDEX "OrgAssignment_memberId_status_effectiveFrom_idx" ON "OrgAssignment"("memberId", "status", "effectiveFrom");

-- CreateIndex
CREATE INDEX "OrgAssignment_projectId_teamId_status_idx" ON "OrgAssignment"("projectId", "teamId", "status");

-- CreateIndex
CREATE INDEX "AttendanceRecord_memberIdText_date_idx" ON "AttendanceRecord"("memberIdText", "date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_date_projectName_idx" ON "AttendanceRecord"("date", "projectName");

-- CreateIndex
CREATE INDEX "AttendanceRecord_date_teamName_idx" ON "AttendanceRecord"("date", "teamName");

-- CreateIndex
CREATE UNIQUE INDEX "Project_orgSlot_key" ON "Project"("orgSlot");

-- CreateIndex
CREATE UNIQUE INDEX "Project_managerId_key" ON "Project"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_leaderMemberId_key" ON "Team"("leaderMemberId");

-- CreateIndex
CREATE INDEX "Team_projectId_category_deletedAt_idx" ON "Team"("projectId", "category", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Team_projectId_category_key" ON "Team"("projectId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "User_ceoSlot_key" ON "User"("ceoSlot");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leaderMemberId_fkey" FOREIGN KEY ("leaderMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgAssignment" ADD CONSTRAINT "OrgAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgAssignment" ADD CONSTRAINT "OrgAssignment_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgAssignment" ADD CONSTRAINT "OrgAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgAssignment" ADD CONSTRAINT "OrgAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgAssignment" ADD CONSTRAINT "OrgAssignment_teamLeadId_fkey" FOREIGN KEY ("teamLeadId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgAssignment" ADD CONSTRAINT "OrgAssignment_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "OrgAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Organizational integrity constraints
ALTER TABLE "Project" ADD CONSTRAINT "Project_orgSlot_range"
  CHECK ("orgSlot" IS NULL OR ("orgSlot" >= 1 AND "orgSlot" <= 6));

ALTER TABLE "User" ADD CONSTRAINT "User_ceoSlot_role_check"
  CHECK (
    ("ceoSlot" IS NULL AND "role"::text <> 'CEO')
    OR ("ceoSlot" = 'CEO' AND "role"::text = 'CEO')
  );

ALTER TABLE "OrgAssignment" ADD CONSTRAINT "OrgAssignment_activeKey_check"
  CHECK (
    ("status" = 'ACTIVE' AND "activeKey" = "memberId")
    OR ("status" = 'INACTIVE' AND "activeKey" IS NULL)
  );

-- Backfill member profile display names from the existing denormalized team link.
UPDATE "Member" m
SET "teamName" = (
  SELECT t."name"
  FROM "TeamMember" tm
  JOIN "Team" t ON t."id" = tm."teamId"
  WHERE tm."memberId" = m."id"
  ORDER BY tm."joinedAt" ASC
  LIMIT 1
)
WHERE m."teamName" IS NULL
  AND EXISTS (SELECT 1 FROM "TeamMember" tm WHERE tm."memberId" = m."id");

-- Backfill historical attendance role/project/team information from current data.
-- These columns are point-in-time snapshots and are never rewritten by later transfers.
WITH ctx AS (
  SELECT DISTINCT ON (tm."memberId")
    tm."memberId",
    t."name",
    t."category",
    t."leaderMemberId",
    p."name" AS "projectName",
    pm."name" AS "managerName"
  FROM "TeamMember" tm
  JOIN "Team" t ON t."id" = tm."teamId"
  LEFT JOIN "ProjectTeam" pt ON pt."teamId" = t."id"
  LEFT JOIN "Project" p ON p."id" = pt."projectId"
  LEFT JOIN "User" pm ON pm."id" = p."managerId"
  ORDER BY tm."memberId", tm."joinedAt" ASC
)
UPDATE "AttendanceRecord" ar
SET
  "memberIdText" = m."memberId",
  "memberName" = u."name",
  "designationName" = CASE
    WHEN ctx."category" IS NOT NULL AND ctx."leaderMemberId" = m."id"
      THEN initcap(ctx."category"::text) || ' Team Lead'
    WHEN ctx."category" IS NOT NULL
      THEN initcap(ctx."category"::text) || ' Developer'
    ELSE CASE u."role"::text
      WHEN 'ADMIN' THEN 'Admin'
      WHEN 'COORDINATOR' THEN 'Coordinator'
      WHEN 'PROJECT_MANAGER' THEN 'Project Manager'
      WHEN 'TEAM_LEADER' THEN 'Team Lead'
      ELSE 'Member'
    END
  END,
  "projectName" = ctx."projectName",
  "projectManagerName" = ctx."managerName",
  "teamName" = COALESCE(ctx."category"::text, ctx."name"),
  "teamLeadName" = lu."name"
FROM "Member" m
JOIN "User" u ON u."id" = m."userId"
LEFT JOIN ctx ON ctx."memberId" = m."id"
LEFT JOIN "Member" lm ON lm."id" = ctx."leaderMemberId"
LEFT JOIN "User" lu ON lu."id" = lm."userId"
WHERE ar."memberId" = m."id";
