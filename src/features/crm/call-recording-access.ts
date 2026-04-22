import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isManagerOrAdmin, isManagerRole } from "@/lib/role-access";

/** 管理员：全组织录音；主管：本人 + 下属销售；销售：仅本人 */
export function callRecordingListWhere(session: Session) {
  if (isAdminRole(session.user.role)) {
    return {};
  }
  if (isManagerRole(session.user.role)) {
    return {
      OR: [{ ownerId: session.user.id }, { owner: { managerId: session.user.id } }],
    };
  }
  return { ownerId: session.user.id };
}

export async function canAccessCustomerForUser(session: Session, customerId: string) {
  const row = await prisma.customer.findFirst({
    where: isManagerOrAdmin(session.user.role)
      ? { id: customerId }
      : { id: customerId, ownerId: session.user.id },
  });
  return Boolean(row);
}
