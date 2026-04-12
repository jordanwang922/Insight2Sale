"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireManagerAction } from "@/server/action-auth";

const DEFAULT_PASSWORD = "demo12345";

export async function createSalesUser(formData: FormData) {
  const session = await requireManagerAction();
  const name = String(formData.get("name") || "").trim();
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();

  if (!name || !username) {
    throw new Error("请填写销售姓名和登录用户名。");
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

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

export async function changePassword(formData: FormData) {
  const session = await auth();
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const currentPassword = String(formData.get("currentPassword") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  const user = await prisma.user.findUnique({
    where: session?.user?.id ? { id: session.user.id } : { username },
  });

  if (!user) {
    throw new Error("当前用户不存在，请检查用户名。");
  }

  const validCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!validCurrent) {
    throw new Error("当前密码不正确。");
  }

  if (password.length < 8) {
    throw new Error("密码至少 8 位。");
  }

  if (password !== confirmPassword) {
    throw new Error("两次输入的密码不一致。");
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
}
