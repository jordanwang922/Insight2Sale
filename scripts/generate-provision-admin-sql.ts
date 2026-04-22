import { loadDotenvFromRoot } from "./load-dotenv";
loadDotenvFromRoot();

/**
 * 根据环境变量中的初始密码生成「插入 admin + 挂靠主管」的 SQL，避免在仓库中存放 bcrypt 或明文密码。
 *
 * 用法（项目根目录）：
 *   node --import tsx --env-file=.env scripts/generate-provision-admin-sql.ts
 * 或：
 *   DEFAULT_NEW_USER_PASSWORD='你的至少8位密码' node --import tsx scripts/generate-provision-admin-sql.ts
 *
 * 将输出重定向到文件后由 psql 执行，勿把含真实哈希的文件提交到 Git。
 */
import bcrypt from "bcryptjs";

async function main() {
  const pwd = process.env.DEFAULT_NEW_USER_PASSWORD?.trim();
  if (!pwd || pwd.length < 8) {
    console.error(
      "错误：请设置环境变量 DEFAULT_NEW_USER_PASSWORD（至少 8 位），或使用：\n  node --import tsx --env-file=.env scripts/generate-provision-admin-sql.ts",
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(pwd, 10);
  const escaped = passwordHash.replace(/'/g, "''");

  const sql = [
    "-- 由 scripts/generate-provision-admin-sql.ts 根据环境变量生成；请勿提交到版本库",
    "-- 执行前请确认已应用含 UserRole.ADMIN 与 \"User\".\"adminId\" 的迁移",
    "",
    "BEGIN;",
    "",
    "INSERT INTO \"User\" (",
    "  id,",
    "  name,",
    "  username,",
    "  email,",
    "  \"passwordHash\",",
    "  role,",
    "  \"defaultPassword\",",
    "  \"managerId\",",
    "  \"adminId\",",
    "  \"createdAt\",",
    "  \"updatedAt\"",
    ")",
    "SELECT",
    "  'cmprovisionadminroot',",
    "  '系统管理员',",
    "  'admin',",
    "  'admin@insight2sale.local',",
    "  '" + escaped + "',",
    "  'ADMIN'::\"UserRole\",",
    "  true,",
    "  NULL,",
    "  NULL,",
    "  NOW(),",
    "  NOW()",
    "WHERE NOT EXISTS (SELECT 1 FROM \"User\" u WHERE u.username = 'admin');",
    "",
    "UPDATE \"User\" m",
    "SET \"adminId\" = a.id,",
    "    \"updatedAt\" = NOW()",
    "FROM \"User\" a",
    "WHERE a.username = 'admin'",
    "  AND a.role = 'ADMIN'::\"UserRole\"",
    "  AND m.role = 'MANAGER'::\"UserRole\"",
    "  AND (m.\"adminId\" IS NULL OR m.username = 'tianmanager');",
    "",
    "COMMIT;",
    "",
  ].join("\n");

  console.log(sql);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
