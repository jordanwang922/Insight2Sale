"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminAction, requireManagerAction } from "@/server/action-auth";
import { getDefaultNewUserPassword } from "@/config/default-credentials";

export async function createSalesUser(formData: FormData) {
  const session = await requireManagerAction();
  const name = String(formData.get("name") || "").trim();
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();

  if (!name || !username) {
    throw new Error("请填写销售姓名和登录用户名。");
  }

  const passwordHash = await bcrypt.hash(getDefaultNewUserPassword(), 10);

  await prisma.user.create({
    data: {
      name,
      username,
      email: `${username}@insight2sale.local`,
      passwordHash,
      role: "SALES",
      managerId: session.user.id,
      defaultPassword: true,
    },
  });

  revalidatePath("/dashboard/manager");
}

/** 管理员新建主管账号（初始密码与新建销售相同，首次登录须改密） */
export async function createManagerUser(formData: FormData) {
  const session = await requireAdminAction();
  const name = String(formData.get("name") || "").trim();
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();

  if (!name || !username) {
    throw new Error("请填写主管姓名和登录用户名。");
  }

  const passwordHash = await bcrypt.hash(getDefaultNewUserPassword(), 10);

  await prisma.user.create({
    data: {
      name,
      username,
      email: `${username}@insight2sale.local`,
      passwordHash,
      role: "MANAGER",
      adminId: session.user.id,
      defaultPassword: true,
    },
  });

  revalidatePath("/dashboard/manager");
}

async function hashDefaultPassword() {
  return bcrypt.hash(getDefaultNewUserPassword(), 10);
}

function assertResetConfirmed(formData: FormData) {
  if (String(formData.get("confirmReset") || "") !== "1") {
    throw new Error("请点击确认重置按钮后再提交。");
  }
}

export async function resetSalesUserPassword(formData: FormData) {
  const session = await requireManagerAction();
  assertResetConfirmed(formData);

  const userId = String(formData.get("userId") || "").trim();
  if (!userId) {
    throw new Error("请选择需要重置密码的销售账号。");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "SALES",
      managerId: session.user.id,
    },
    select: { id: true },
  });

  if (!user) {
    throw new Error("未找到该销售账号，或当前主管无权重置。");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashDefaultPassword(),
      defaultPassword: true,
    },
  });

  revalidatePath("/dashboard/manager");
}

export async function resetManagerUserPassword(formData: FormData) {
  await requireAdminAction();
  assertResetConfirmed(formData);

  const userId = String(formData.get("userId") || "").trim();
  if (!userId) {
    throw new Error("请选择需要重置密码的主管账号。");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "MANAGER",
    },
    select: { id: true },
  });

  if (!user) {
    throw new Error("未找到该主管账号，或当前管理员无权重置。");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashDefaultPassword(),
      defaultPassword: true,
    },
  });

  revalidatePath("/dashboard/manager");
}

export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

/**
 * 修改密码（表单提交）。成功返回 `{ ok: true }`，失败返回 `{ ok: false; error }`，便于客户端展示错误而不抛错。
 */
export async function changePassword(formData: FormData): Promise<ChangePasswordResult> {
  const session = await auth();
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const currentPassword = String(formData.get("currentPassword") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  const user = await prisma.user.findUnique({
    where: session?.user?.id ? { id: session.user.id } : { username },
  });

  if (!user) {
    return { ok: false, error: "当前用户不存在，请检查用户名。" };
  }

  const validCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!validCurrent) {
    return { ok: false, error: "当前密码不正确。" };
  }

  if (password.length < 8) {
    return { ok: false, error: "密码至少 8 位。" };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "两次输入的新密码不一致。" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      defaultPassword: false,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/login");

  return { ok: true };
}
