-- ============================================================================
-- 重要：请勿在仓库中存放含真实 bcrypt 或明文密码的 SQL（会触发 GitHub Secret 扫描）。
-- ============================================================================
--
-- 云端/生产需要「创建 admin + 主管挂 adminId」时，请在**有 .env 的机器**上生成 SQL：
--
--   cd 项目根目录
--   node --import tsx --env-file=.env scripts/generate-provision-admin-sql.ts > /tmp/provision-admin.sql
--   psql "$DATABASE_URL" -f /tmp/provision-admin.sql
--
-- 其中 `.env` 须包含：DEFAULT_NEW_USER_PASSWORD=（至少 8 位，与线上一致）
--
-- 本地开发也可用 `npm run db:seed`（会写入演示数据，生产慎用）。
-- ============================================================================

SELECT 1 AS "请阅读本文件上方说明，勿直接执行本 SELECT";
