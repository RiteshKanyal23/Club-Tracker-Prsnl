-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN "photoPath" TEXT;
ALTER TABLE "AttendanceRecord" ADD COLUMN "markedById" TEXT;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
