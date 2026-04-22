import type { UserRole } from "@prisma/client";

export function isAdminRole(role: UserRole | string | undefined | null): boolean {
  return role === "ADMIN";
}

export function isManagerRole(role: UserRole | string | undefined | null): boolean {
  return role === "MANAGER";
}

export function isSalesRole(role: UserRole | string | undefined | null): boolean {
  return role === "SALES";
}

/** 主管或管理员：全量客户、知识库、测评、模板、预约等「管理台」能力 */
export function isManagerOrAdmin(role: UserRole | string | undefined | null): boolean {
  return role === "MANAGER" || role === "ADMIN";
}
