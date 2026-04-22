"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { intakeFields } from "@/features/assessment/intake-fields";
import {
  anxietyQuestions,
  burnoutQuestions,
  competenceQuestions,
  coreQuestions,
} from "@/features/assessment/questions";
import { scoreAssessment } from "@/features/assessment/scoring";
import { buildSalesSummary, toRadarData } from "@/features/assessment/report";
import { AssessmentAnswer } from "@/features/assessment/types";
import { isValidChineseMobile } from "@/lib/validation";

const allQuestions = [
  ...coreQuestions,
  ...anxietyQuestions,
  ...burnoutQuestions,
  ...competenceQuestions,
];

function getValue(formData: FormData, key: string) {
  const values = formData.getAll(key);
  if (!values.length) return "";
  if (values.length === 1) return String(values[0]);
  return JSON.stringify(values.map((item) => String(item)));
}

export async function submitAssessment(formData: FormData) {
  const templateSlug = String(formData.get("templateSlug") || "").trim();
  const status = await prisma.statusDefinition.findFirst({
    where: { code: "assessment_done" },
  });
  const owner = await prisma.user.findFirst({
    where: { role: "MANAGER" },
    orderBy: { createdAt: "asc" },
  });
  const template = await prisma.assessmentTemplate.findFirst({
    where: templateSlug
      ? { slug: templateSlug, enabled: true }
      : { isPrimary: true, enabled: true },
  });

  if (!owner || !status || !template) {
    throw new Error("系统初始化未完成，请先执行数据库种子脚本。");
  }

  const intakeData = Object.fromEntries(
    intakeFields.map((field) => [field.key, getValue(formData, field.key)]),
  );

  const phone = String(intakeData.phone || "").trim();
  if (!isValidChineseMobile(phone)) {
    throw new Error("请输入正确的 11 位手机号。");
  }

  for (const field of intakeFields) {
    const rawValue = intakeData[field.key];
    const missingMultiValue =
      field.type === "multi-select" &&
      (!rawValue || rawValue === "[]" || rawValue === "");

    if (field.required && (!rawValue || missingMultiValue)) {
      throw new Error(`缺少必填字段：${field.label}`);
    }
  }

  const answers: AssessmentAnswer[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("q_")) continue;
    const questionId = Number(key.replace("q_", ""));
    const payload = JSON.parse(String(value)) as { label: string; score: number };
    answers.push({
      questionId,
      selectedOption: payload.label,
      score: payload.score,
    });
  }

  if (answers.length !== allQuestions.length) {
    throw new Error(`测评题目未完成，当前已答 ${answers.length} / ${allQuestions.length} 题。`);
  }

  const report = scoreAssessment(answers);
  const customerPayload = {
    ownerId: owner.id,
    currentStatusId: status.id,
    wechatNickname: String(intakeData.wechatNickname || "未填写昵称"),
    phone,
    memberStatus: String(intakeData.memberStatus || ""),
    gender: String(intakeData.gender || ""),
    education: String(intakeData.education || ""),
    ageRange: String(intakeData.ageRange || ""),
    childrenCount: String(intakeData.childrenCount || ""),
    childAgeRanges: String(intakeData.childAgeRanges || "[]"),
    decisionMakerCount: String(intakeData.decisionMakerCount || ""),
    primaryCaretaker: String(intakeData.primaryCaretaker || ""),
    parentingRole: String(intakeData.parentingRole || ""),
    occupationCategory: String(intakeData.occupationCategory || ""),
    occupationDetail: String(intakeData.occupationDetail || ""),
    residenceCity: String(intakeData.residenceCity || "").trim(),
    source: template.shortName,
    sourceDetail: template.slug,
    ipLocation: "待补充",
    totalScore: report.overallScore,
    completionSeconds: Number(formData.get("completionSeconds") || 0),
    submittedAt: new Date(),
    coreProblem: String(intakeData.coreProblem || ""),
    /** v2 问卷将「难题 + 担心」合并为一题，仅写入 coreProblem */
    coreConcern: "",
    attemptedActions: String(intakeData.attemptedActions || ""),
    /** v2 问卷将「做法 + 效果」合并为一题，仅写入 attemptedActions */
    attemptedOutcome: "",
    desiredSupport: String(intakeData.desiredSupport || ""),
  };

  const existingCustomer = customerPayload.phone
    ? await prisma.customer.findUnique({
        where: { phone: customerPayload.phone },
        select: { id: true, currentStatusId: true },
      })
    : null;

  const customer = existingCustomer
    ? await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: customerPayload,
      })
    : await prisma.customer.create({
        data: customerPayload,
      });

  await prisma.statusTransition.create({
    data: {
      customerId: customer.id,
      fromStatusId: existingCustomer?.currentStatusId ?? null,
      toStatusId: status.id,
      operatorName: "system",
      notes: existingCustomer
        ? "家长重新完成测评，系统更新客户画像并回写报告"
        : "家长完成测评，自动进入已完成测评状态",
    },
  });

  const submission = await prisma.assessmentSubmission.create({
    data: {
      customerId: customer.id,
      version: "v1",
      templateId: template.id,
      totalScore: report.overallScore,
      answersData: JSON.stringify(answers),
      intakeData: JSON.stringify(intakeData),
    },
  });

  const reportWithSummary = {
    ...report,
    salesSummary: buildSalesSummary(report, customer.wechatNickname),
  };

  await prisma.reportSnapshot.create({
    data: {
      customerId: customer.id,
      submissionId: submission.id,
      parentType: report.parentType.name,
      overallScore: report.overallScore,
      anxietyPercent: report.anxiety.percent,
      burnoutPercent: report.burnout.percent,
      competencePercent: report.competence.percent,
      parentRadarData: JSON.stringify(toRadarData(report, "parent")),
      childRadarData: JSON.stringify(toRadarData(report, "child")),
      courseRecommendations: JSON.stringify(report.courseRecommendations),
      reportData: JSON.stringify(reportWithSummary),
    },
  });

  redirect(`/assessment/result/${submission.id}`);
}
