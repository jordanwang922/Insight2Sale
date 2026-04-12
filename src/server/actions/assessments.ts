"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { requireManagerAction } from "@/server/action-auth";
import { extractKnowledgeText, persistKnowledgeFile } from "@/features/knowledge/ingestion";
import { generateDoubaoJson } from "@/lib/ai/doubao";

interface AssessmentTemplateDraft {
  shortName: string;
  description: string;
  introTitle: string;
  introBody: string;
  reportOutline: string[];
}

async function buildAssessmentDraft(title: string, sourceText: string) {
  const fallback: AssessmentTemplateDraft = {
    shortName: title,
    description: "围绕家长养育能力与孩子成长潜能的测评工具。",
    introTitle: title,
    introBody: "先完成测评，再根据结果生成解读和销售 SOP。",
    reportOutline: [
      "基本信息与测评时间",
      "孩子与家长 6 维度雷达图",
      "家长类型解读",
      "关键风险与课程挂钩建议",
    ],
  };

  return generateDoubaoJson<AssessmentTemplateDraft>({
    system:
      "你是家庭教育测评产品经理。根据上传的测评资料，输出一个用于 CRM 系统中的测评模板草案 JSON。只输出 JSON，不要输出 markdown。",
    user: JSON.stringify(
      {
        title,
        sourceText: sourceText.slice(0, 12000),
        format: {
          shortName: "string",
          description: "string",
          introTitle: "string",
          introBody: "string",
          reportOutline: ["string"],
        },
      },
      null,
      2,
    ),
    fallback,
  });
}

export async function createAssessmentTemplate(formData: FormData) {
  const session = await requireManagerAction();

  const title = String(formData.get("title") || "").trim();
  const shortNameInput = String(formData.get("shortName") || "").trim();
  const descriptionInput = String(formData.get("description") || "").trim();
  const sourceType = String(formData.get("sourceType") || "manual").trim();
  const sourceTextInput = String(formData.get("sourceText") || "").trim();
  const shouldPrimary = formData.get("isPrimary") === "on";
  const file = formData.get("file");

  if (!title) {
    throw new Error("请先填写测评名称。");
  }

  let sourceText = sourceTextInput;
  let sourceDocument: string | null = null;

  if (!sourceText && file instanceof File && file.size > 0) {
    const persisted = await persistKnowledgeFile(file);
    sourceText = await extractKnowledgeText(file, persisted.buffer);
    sourceDocument = persisted.filePath;
  }

  const aiDraft = sourceText ? await buildAssessmentDraft(title, sourceText) : null;
  const slugBase = slugify(String(formData.get("slug") || title)) || `assessment-${Date.now()}`;
  const slug = `${slugBase}-${Date.now().toString().slice(-6)}`;

  if (shouldPrimary) {
    await prisma.assessmentTemplate.updateMany({
      where: { isPrimary: true },
      data: { isPrimary: false },
    });
  }

  await prisma.assessmentTemplate.create({
    data: {
      title,
      slug,
      shortName: shortNameInput || aiDraft?.shortName || title,
      description: descriptionInput || aiDraft?.description || "待补充描述",
      introTitle: aiDraft?.introTitle ?? title,
      introBody: aiDraft?.introBody ?? descriptionInput ?? "待补充测评前置说明",
      reportOutlineJson: JSON.stringify(aiDraft?.reportOutline ?? []),
      configJson: JSON.stringify({
        runtime: sourceText ? "document-draft" : "builtin-parenting-v1",
        generatedByAi: Boolean(sourceText),
      }),
      sourceType,
      sourceDocument,
      sourceText: sourceText || null,
      enabled: true,
      isPrimary: shouldPrimary,
      createdById: session.user.id,
    },
  });

  revalidatePath("/dashboard/assessments");
  revalidatePath("/dashboard");
  revalidatePath("/assessment");
}

export async function updateAssessmentTemplate(formData: FormData) {
  await requireManagerAction();

  const id = String(formData.get("id") || "");
  if (!id) return;

  const isPrimary = formData.get("isPrimary") === "on";
  if (isPrimary) {
    await prisma.assessmentTemplate.updateMany({
      where: { isPrimary: true, NOT: { id } },
      data: { isPrimary: false },
    });
  }

  await prisma.assessmentTemplate.update({
    where: { id },
    data: {
      title: String(formData.get("title") || ""),
      shortName: String(formData.get("shortName") || ""),
      description: String(formData.get("description") || ""),
      enabled: formData.get("enabled") === "on",
      isPrimary,
    },
  });

  revalidatePath("/dashboard/assessments");
  revalidatePath("/dashboard");
  revalidatePath("/assessment");
}
