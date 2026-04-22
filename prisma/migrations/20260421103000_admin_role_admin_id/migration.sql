-- 新增角色 ADMIN；主管挂管理员 adminId（请在各环境仅执行一次）
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';

ALTER TABLE "User" ADD COLUMN "adminId" TEXT;

CREATE INDEX "User_adminId_idx" ON "User"("adminId");

ALTER TABLE "User" ADD CONSTRAINT "User_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
