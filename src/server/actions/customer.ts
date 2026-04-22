"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomerAccess, requireManagerOrAdminAction } from "@/server/action-auth";

export async function addFollowUpNote(formData: FormData) {
  const customerId = String(formData.get("customerId"));
  const summary = String(formData.get("summary"));
  const customerQuotes = String(formData.get("customerQuotes") ?? "");
  const channel = String(formData.get("channel") ?? "电话");

  if (!customerId || !summary) {
    return;
  }

  const { session } = await requireCustomerAccess(customerId);

  await prisma.followUpNote.create({
    data: {
      customerId,
      authorId: session.user.id,
      summary,
      customerQuotes,
      channel,
    },
  });

  revalidatePath(`/dashboard/customers/${customerId}`);
}

export async function assignCustomerOwner(formData: FormData) {
  const session = await requireManagerOrAdminAction();
  const customerId = String(formData.get("customerId") || "");
  const ownerId = String(formData.get("ownerId") || "");

  if (!customerId || !ownerId) {
    return;
  }

  const assigneeWhere =
    session.user.role === "ADMIN"
      ? { id: ownerId, role: { in: [UserRole.MANAGER, UserRole.SALES] } }
      : {
          id: ownerId,
          OR: [
            { id: session.user.id, role: UserRole.MANAGER },
            { role: UserRole.SALES, managerId: session.user.id },
          ],
        };

  const [customer, assignee] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, ownerId: true, wechatNickname: true },
    }),
    prisma.user.findFirst({
      where: assigneeWhere,
      select: { id: true, name: true },
    }),
  ]);

  if (!customer || !assignee) {
    throw new Error("客户或销售不存在。");
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: { ownerId: assignee.id },
  });

  await prisma.appointment.updateMany({
    where: {
      customerId,
      startAt: { gte: new Date() },
    },
    data: { ownerId: assignee.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/manager");
}
