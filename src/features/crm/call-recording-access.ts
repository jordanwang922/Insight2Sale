import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

/** 主管可见本人 + 下属销售的录音；销售仅本人 */
export function callRecordingListWhere(session: Session) {
  if (session.user.role === "MANAGER") {
    return {
      OR: [{ ownerId: session.user.id }, { owner: { managerId: session.user.id } }],
    };
  }
  return { ownerId: session.user.id };
}

export async function canAccessCustomerForUser(session: Session, customerId: string) {
  const row = await prisma.customer.findFirst({
    where:
      session.user.role === "MANAGER"
        ? { id: customerId }
        : { id: customerId, ownerId: session.user.id },
  });
  return Boolean(row);
}
