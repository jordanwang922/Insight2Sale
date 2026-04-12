"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireActionSession() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("请先登录后再执行操作。");
  }

  return session;
}

export async function requireManagerAction() {
  const session = await requireActionSession();

  if (session.user.role !== "MANAGER") {
    throw new Error("当前账号没有执行该操作的权限。");
  }

  return session;
}

export async function requireCustomerAccess(customerId: string) {
  const session = await requireActionSession();
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { owner: true },
  });

  if (!customer) {
    throw new Error("客户不存在。");
  }

  if (session.user.role !== "MANAGER" && customer.ownerId !== session.user.id) {
    throw new Error("你没有权限操作这个客户。");
  }

  return { session, customer };
}
