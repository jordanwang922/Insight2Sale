"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionSession, requireCustomerAccess } from "@/server/action-auth";
import { isManagerOrAdmin } from "@/lib/role-access";

export async function createAppointment(formData: FormData) {
  const session = await requireActionSession();
  const customerId = String(formData.get("customerId") || "");
  const ownerId = String(formData.get("ownerId") || session.user.id);
  const title = String(formData.get("title") || "").trim();
  const kind = String(formData.get("kind") || "").trim();
  const participantName = String(formData.get("participantName") || "").trim();
  const startAt = String(formData.get("startAt"));
  const endAt = String(formData.get("endAt"));
  const notes = String(formData.get("notes") || "");

  if ((!title && !kind) || !startAt || !endAt) return;

  let resolvedOwnerId = ownerId;
  let resolvedCustomerId: string | null = null;
  let pathToRevalidate = "/dashboard/calendar";

  if (customerId) {
    const { customer } = await requireCustomerAccess(customerId);
    resolvedCustomerId = customer.id;
    resolvedOwnerId = customer.ownerId;
    pathToRevalidate = `/dashboard/customers/${customerId}`;
  } else if (participantName) {
    const matchedCustomer = await prisma.customer.findFirst({
      where: isManagerOrAdmin(session.user.role)
        ? { wechatNickname: participantName }
        : { wechatNickname: participantName, ownerId: session.user.id },
      select: { id: true, ownerId: true },
      orderBy: { submittedAt: "desc" },
    });

    if (matchedCustomer) {
      resolvedCustomerId = matchedCustomer.id;
      resolvedOwnerId = isManagerOrAdmin(session.user.role)
        ? ownerId || matchedCustomer.ownerId
        : matchedCustomer.ownerId;
    }
  } else if (!isManagerOrAdmin(session.user.role) && ownerId !== session.user.id) {
    throw new Error("你没有权限为其他销售创建预约。");
  }

  await prisma.appointment.create({
    data: {
      customerId: resolvedCustomerId,
      ownerId: resolvedOwnerId,
      title: title || kind,
      kind: kind || title,
      participantName: participantName || null,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      notes,
    },
  });

  revalidatePath(pathToRevalidate);
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/manager");
}

export async function updateAppointment(formData: FormData) {
  const session = await requireActionSession();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const kind = String(formData.get("kind") || "").trim();
  const participantName = String(formData.get("participantName") || "").trim();
  const startAt = String(formData.get("startAt") || "");
  const endAt = String(formData.get("endAt") || "");
  const notes = String(formData.get("notes") || "");

  if (!id || !title || !startAt || !endAt) return;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) return;
  if (!isManagerOrAdmin(session.user.role) && appointment.ownerId !== session.user.id) {
    throw new Error("你没有权限修改这个预约。");
  }

  let resolvedCustomerId = appointment.customerId;
  if (!resolvedCustomerId && participantName) {
    const matchedCustomer = await prisma.customer.findFirst({
      where: isManagerOrAdmin(session.user.role)
        ? { wechatNickname: participantName }
        : { wechatNickname: participantName, ownerId: session.user.id },
      select: { id: true },
      orderBy: { submittedAt: "desc" },
    });
    resolvedCustomerId = matchedCustomer?.id ?? null;
  }

  await prisma.appointment.update({
    where: { id },
    data: {
      customerId: resolvedCustomerId,
      title,
      kind: kind || title,
      participantName: participantName || null,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      notes,
    },
  });

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
}

export async function deleteAppointment(formData: FormData) {
  const session = await requireActionSession();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) return;
  if (!isManagerOrAdmin(session.user.role) && appointment.ownerId !== session.user.id) {
    throw new Error("你没有权限删除这个预约。");
  }

  await prisma.appointment.delete({
    where: { id },
  });

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
}
