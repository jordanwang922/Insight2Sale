"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionSession, requireManagerOrAdminAction } from "@/server/action-auth";
import { isAdminRole, isManagerRole } from "@/lib/role-access";

async function assertMayEditSalesPersona(session: { user: { id: string; role: string } }, targetUserId: string) {
  if (isAdminRole(session.user.role)) return;
  if (session.user.id === targetUserId) return;
  if (isManagerRole(session.user.role)) {
    const subordinate = await prisma.user.findFirst({
      where: { id: targetUserId, managerId: session.user.id, role: "SALES" },
    });
    if (subordinate) return;
  }
  throw new Error("你没有权限修改该销售文案。");
}

export async function savePersonaProfile(formData: FormData) {
  const session = await requireActionSession();
  const userId = String(formData.get("userId"));
  const customerId = String(formData.get("customerId") || "");
  if (!userId) return;

  await assertMayEditSalesPersona(session, userId);

  const existing = await prisma.personaProfile.findUnique({
    where: { userId },
  });

  await prisma.personaProfile.upsert({
    where: { userId },
    update: {
      displayTitle: String(formData.get("displayTitle") || existing?.displayTitle || ""),
      introHeadline: String(formData.get("introHeadline") || existing?.introHeadline || ""),
      expertiseSummary: String(
        formData.get("expertiseSummary") || existing?.expertiseSummary || "",
      ),
      trustSignal: String(formData.get("trustSignal") || existing?.trustSignal || ""),
      openingStyle: String(formData.get("openingStyle") || existing?.openingStyle || ""),
      inviteStyle: String(formData.get("inviteStyle") || existing?.inviteStyle || ""),
    },
    create: {
      userId,
      displayTitle: String(formData.get("displayTitle") || ""),
      introHeadline: String(formData.get("introHeadline") || ""),
      expertiseSummary: String(formData.get("expertiseSummary") || ""),
      trustSignal: String(formData.get("trustSignal") || ""),
      openingStyle: String(formData.get("openingStyle") || ""),
      inviteStyle: String(formData.get("inviteStyle") || ""),
    },
  });

  revalidatePath("/dashboard");
  if (customerId) {
    revalidatePath(`/dashboard/customers/${customerId}`);
  }
}

export async function importPersonaLibraryToOpeningStyle(formData: FormData) {
  const session = await requireActionSession();
  const userId = String(formData.get("userId") || "");
  const customerId = String(formData.get("customerId") || "");

  if (!userId) return;
  await assertMayEditSalesPersona(session, userId);

  const persona = await prisma.personaProfile.findUnique({
    where: { userId },
  });

  if (!persona) {
    throw new Error("当前销售还没有保存个人文案库。");
  }

  const openingStyle = [
    persona.displayTitle,
    persona.introHeadline,
    persona.expertiseSummary,
    persona.trustSignal,
    persona.inviteStyle,
  ]
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n\n");

  await prisma.personaProfile.update({
    where: { userId },
    data: { openingStyle },
  });

  revalidatePath("/dashboard");
  if (customerId) {
    revalidatePath(`/dashboard/customers/${customerId}`);
  }
}

export async function submitTemplateSnippet(formData: FormData) {
  const session = await requireActionSession();
  const title = String(formData.get("title") || "");
  const content = String(formData.get("content") || "");
  const applicableDimension = String(formData.get("applicableDimension") || "");
  const applicableParentType = String(formData.get("applicableParentType") || "");
  const applicableStage = String(formData.get("applicableStage") || "");
  const customerId = String(formData.get("customerId") || "");
  const sectionKey = String(formData.get("sectionKey") || "generic");
  const sectionTitle = String(formData.get("sectionTitle") || title || "补充话术");

  if (!title || !content) return;

  if (customerId) {
    await prisma.supplementalScript.create({
      data: {
        customerId,
        authorId: session.user.id,
        sectionKey,
        sectionTitle,
        content,
      },
    });
  } else {
    await prisma.scriptTemplate.create({
      data: {
        authorId: session.user.id,
        category: "sales-snippet",
        title,
        content,
        applicableDimension: applicableDimension || null,
        applicableParentType: applicableParentType || null,
        applicableStage: applicableStage || null,
        source: "sales_submission",
        approvalState: "pending",
        priority: 80,
      },
    });
  }

  revalidatePath("/dashboard");
  if (customerId) {
    revalidatePath(`/dashboard/customers/${customerId}`);
  }
}

export async function approveSupplementalScript(formData: FormData) {
  const session = await requireManagerOrAdminAction();
  const id = String(formData.get("id") || "");
  const shouldApprove = formData.get("approvedToTemplate") === "on";
  const title = String(formData.get("title") || "");
  const applicableDimension = String(formData.get("applicableDimension") || "");
  const applicableStage = String(formData.get("applicableStage") || "");
  const applicableParentType = String(formData.get("applicableParentType") || "");

  if (!id) return;

  const script = await prisma.supplementalScript.findUnique({
    where: { id },
    include: { author: true },
  });

  if (!script) return;

  await prisma.supplementalScript.update({
    where: { id },
    data: {
      approvedToTemplate: shouldApprove,
      approvedAt: shouldApprove ? new Date() : null,
      approvedById: shouldApprove ? session.user.id : null,
      approvedByName: shouldApprove ? session.user.name ?? "" : null,
    },
  });

  if (shouldApprove) {
    const existing = await prisma.scriptTemplate.findFirst({
      where: {
        source: "manager_approved_snippet",
        content: script.content,
        authorId: script.authorId,
      },
    });

    if (!existing) {
      await prisma.scriptTemplate.create({
        data: {
          authorId: script.authorId,
          category: "sales-snippet",
          title: title || `${script.sectionTitle}补充话术`,
          content: script.content,
          applicableDimension: applicableDimension || null,
          applicableParentType: applicableParentType || null,
          applicableStage: applicableStage || null,
          source: "manager_approved_snippet",
          approvalState: "approved",
          priority: 70,
        },
      });
    }
  }

  revalidatePath("/dashboard/templates");
  revalidatePath(`/dashboard/customers/${script.customerId}`);
}

export async function updateTemplateMetadata(formData: FormData) {
  await requireManagerOrAdminAction();

  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.scriptTemplate.update({
    where: { id },
    data: {
      approvalState: String(formData.get("approvalState") || "approved"),
      priority: Number(formData.get("priority") || 100),
    },
  });

  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard");
}
