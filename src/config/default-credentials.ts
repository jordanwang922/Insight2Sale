/**
 * 新建销售 / 新建主管的初始登录密码（与首次登录强制改密一致）。
 * 必须通过环境变量配置，**禁止**在仓库中硬编码真实密码（避免 GitGuardian 等扫描误报与泄露）。
 *
 * 部署/本地：在 `.env` 中设置 `DEFAULT_NEW_USER_PASSWORD`（至少 8 位，与登录校验一致）。
 * @see `.env.example`
 */
const TEST_PLACEHOLDER = "test-only-initial-pwd-12";

export function getDefaultNewUserPassword(): string {
  const fromEnv =
    process.env.DEFAULT_NEW_USER_PASSWORD?.trim() ||
    process.env.INSIGHT2SALE_DEFAULT_NEW_USER_PASSWORD?.trim();

  if (fromEnv && fromEnv.length >= 8) {
    return fromEnv;
  }

  if (process.env.VITEST === "true" || process.env.NODE_ENV === "test") {
    return TEST_PLACEHOLDER;
  }

  throw new Error(
    "未配置 DEFAULT_NEW_USER_PASSWORD（或不足 8 位）。请在 .env 中设置，例如与首次改密策略一致的初始密码。参见 .env.example。",
  );
}

/** @deprecated 请使用 getDefaultNewUserPassword() */
export function getDefaultSalesPassword(): string {
  return getDefaultNewUserPassword();
}
