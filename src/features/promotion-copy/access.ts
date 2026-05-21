import { Prisma, UserRole } from "@prisma/client";

export function buildPromotionVisibilityWhere(
  role: UserRole,
  userId: string,
  managerId?: string | null,
): Prisma.PromotionCopyWhereInput {
  if (role === "ADMIN") {
    return {};
  }

  if (role === "MANAGER") {
    return {
      enabled: true,
      OR: [{ scope: "global" }, { teamScopeManagerId: userId }],
    };
  }

  return {
    enabled: true,
    OR: [{ scope: "global" }, ...(managerId ? [{ teamScopeManagerId: managerId }] : [])],
  };
}

export function canViewPromotionCopy(params: {
  role: UserRole;
  userId: string;
  managerId?: string | null;
  scope: string;
  teamScopeManagerId?: string | null;
}) {
  if (params.role === "ADMIN") return true;
  if (params.scope === "global") return true;
  if (params.role === "MANAGER") {
    return params.teamScopeManagerId === params.userId;
  }
  return Boolean(params.managerId && params.teamScopeManagerId === params.managerId);
}

export function canManagePromotionCopy(params: {
  role: UserRole;
  userId: string;
  scope: string;
  teamScopeManagerId?: string | null;
  createdById: string;
}) {
  if (params.role === "ADMIN") return true;
  if (params.role !== "MANAGER") return false;
  if (params.scope !== "team") return false;
  return params.teamScopeManagerId === params.userId || params.createdById === params.userId;
}
