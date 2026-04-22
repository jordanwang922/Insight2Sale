"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminAction, requireManagerAction } from "@/server/action-auth";
import { DEFAULT_NEW_USER_PASSWORD } from "@/config/default-credentials";

export async function createSalesUser(formData: FormData) {
  const session = await requireManagerAction();
  const name = String(formData.get("name") || "").trim();
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();

  if (!name || !username) {
    throw new Error("请填写销售姓名和登录用户名。");
  }

  const passwordHash = await bcrypt.hash(DEFAULT_NEW_USER_PASSWORD, 10);

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

  const passwordHash = await bcrypt.hash(DEFAULT_NEW_USER_PASSWORD, 10);

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
