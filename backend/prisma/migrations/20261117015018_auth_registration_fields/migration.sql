-- AlterTable
ALTER TABLE "User" ADD COLUMN "adminId" TEXT;
CREATE UNIQUE INDEX "User_adminId_key" ON "User"("adminId");

-- AlterTable
ALTER TABLE "Member" ADD COLUMN "memberId" TEXT;
ALTER TABLE "Member" ADD COLUMN "phone" TEXT;
ALTER TABLE "Member" ADD COLUMN "teamName" TEXT;
CREATE UNIQUE INDEX "Member_memberId_key" ON "Member"("memberId");