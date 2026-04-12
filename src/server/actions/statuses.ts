"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomerAccess, requireManagerAction } from "@/server/action-auth";

export async function createStatusDefinition(formData: FormData) {
  await requireManagerAction();

  const code = String(formData.get("code"));
  const name = String(formData.get("name"));
  const color = String(formData.get("color") || "#64748b");
  const sortOrder = Number(formData.get("sortOrder") || 999);

  if (!code || !name) {
    return;
  }

  await prisma.statusDefinition.create({
    data: {
      code,
      name,
      color,
      sortOrder,
      enabled: true,
    },
  });

  revalidatePath("/dashboard/settings/statuses");
}

export async function updateStatusDefinition(formData: FormData) {
  await requireManagerAction();

  const id = String(formData.get("id") || "");

  if (!id) return;

  await prisma.statusDefinition.update({
    where: { id },
    data: {
      name: String(formData.get("name") || ""),
      color: String(formData.get("color") || "#64748b"),
      sortOrder: Number(formData.get("sortOrder") || 999),
      enabled: formData.get("enabled") === "on",
      inPrimaryFunnel: formData.get("inPrimaryFunnel") === "on",
      manualAllowed: formData.get("manualAllowed") === "on",
      description: String(formData.get("description") || ""),
    },
  });

  revalidatePath("/dashboard/settings/statuses");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/manager");
}

export async function updateCustomerStatus(formData: FormData) {
  const customerId = String(formData.get("customerId"));
  const toStatusId = String(formData.get("toStatusId"));
  const notes = String(formData.get("notes") || "");

  if (!customerId || !toStatusId) {
    return;
  }

  const { session, customer } = await requireCustomerAccess(customerId);

  await prisma.customer.update({
    where: { id: customerId },
    data: { currentStatusId: toStatusId },
  });

  await prisma.statusTransition.create({
    data: {
      customerId,
      fromStatusId: customer?.currentStatusId ?? null,
      toStatusId,
      operatorName: session.user.name ?? session.user.email ?? "系统用户",
      notes,
    },
  });

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/manager");
}
