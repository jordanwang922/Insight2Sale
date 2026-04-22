-- 在云端/生产库执行前请确认：
-- 1) 已应用含 UserRole.ADMIN 与 "User"."adminId" 的迁移（见 prisma/migrations/20260421103000_admin_role_admin_id/migration.sql）
-- 2) 按需替换下方 passwordHash：须为 bcrypt（与 Next 登录校验一致）。下面示例为密码 fscrm2026、cost=10 的一次生成结果；
--    若你重新 hash，请用 Node：require('bcryptjs').hash('fscrm2026', 10).then(console.log)

BEGIN;

-- 若已存在 admin 用户则跳过插入（不覆盖已有密码）
INSERT INTO "User" (
  id,
  name,
  username,
  email,
  "passwordHash",
  role,
  "defaultPassword",
  "managerId",
  "adminId",
  "createdAt",
  "updatedAt"
)
SELECT
  'cmprovisionadminroot',
  '系统管理员',
  'admin',
  'admin@insight2sale.local',
  '$2b$10$SR2GbpAsl2NqfkoIRQn6EOgcoVqBd4prXCvUP8kz/zn7vCKS.xlFe',
  'ADMIN'::"UserRole",
  true,
  NULL,
  NULL,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.username = 'admin');

-- 未挂管理员的主管挂到 admin；并确保 tianmanager 指向该 admin
UPDATE "User" m
SET "adminId" = a.id,
    "updatedAt" = NOW()
FROM "User" a
WHERE a.username = 'admin'
  AND a.role = 'ADMIN'::"UserRole"
  AND m.role = 'MANAGER'::"UserRole"
  AND (m."adminId" IS NULL OR m.username = 'tianmanager');

COMMIT;

-- 验证：
-- SELECT id, username, role, "adminId" FROM "User" WHERE username IN ('admin','tianmanager');
