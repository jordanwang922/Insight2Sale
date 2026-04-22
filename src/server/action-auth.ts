"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isManagerOrAdmin } from "@/lib/role-access";

export async function requireActionSession() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("请先登录后再执行操作。");
  }

  return session;
}

/** 仅主管（新建销售等团队内操作） */
export async function requireManagerAction() {
  const session = await requireActionSession();

  if (session.user.role !== "MANAGER") {
    throw new Error("当前账号没有执行该操作的权限。");
  }

  return session;
}

/** 主管或管理员（知识库、测评、模板、客户归属等） */
export async function requireManagerOrAdminAction() {
  const session = await requireActionSession();

  if (!isManagerOrAdmin(session.user.role)) {
    throw new Error("当前账号没有执行该操作的权限。");
  }

  return session;
}

/** 仅系统管理员（新建主管） */
export async function requireAdminAction() {
  const session = await requireActionSession();

  if (!isAdminRole(session.user.role)) {
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

  if (!isManagerOrAdmin(session.user.role) && customer.ownerId !== session.user.id) {
    throw new Error("你没有权限操作这个客户。");
  }

  return { session, customer };
}
