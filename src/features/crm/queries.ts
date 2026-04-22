import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { toRadarData } from "@/features/assessment/report";
import { AssessmentReport } from "@/features/assessment/types";
import { buildMonthCalendar } from "@/features/crm/calendar";
import { buildKbWorkspaceInterpretation } from "@/features/knowledge/interpretation-lookup";
import {
  retrieveKnowledge,
  retrieveKnowledgeChunksForDocument,
  type RetrievedKnowledge,
} from "@/features/knowledge/retrieval";
import { knowledgeCategories } from "@/features/knowledge/categories";
import { categoryFromSlug } from "@/features/knowledge/category-slugs";
import { callRecordingListWhere } from "@/features/crm/call-recording-access";
import { isAdminRole, isManagerOrAdmin } from "@/lib/role-access";

const ownerPalette = ["#f59e0b", "#8b5cf6", "#10b981", "#0ea5e9", "#ef4444", "#f97316"];

function getOwnerColor(index: number) {
  return ownerPalette[index % ownerPalette.length];
}

export async function requireSession() {
  const session = await auth();
  return session;
}

export async function requireManagerSession() {
  const session = await requireSession();
  if (!session?.user?.id || !isManagerOrAdmin(session.user.role)) {
    return null;
  }

  return session;
}

export async function getPrimaryAssessment() {
  return prisma.assessmentTemplate.findFirst({
    where: { enabled: true, isPrimary: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDashboardSummary() {
  const session = await requireSession();
  if (!session?.user?.id) return null;
  const now = new Date();
  const dayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const dayEnd = new Date(new Date().setHours(23, 59, 59, 999));

  const where = isManagerOrAdmin(session.user.role) ? {} : { ownerId: session.user.id };
  const primaryAssessment = await getPrimaryAssessment();

  const [customers, statuses, appointments, assignableSales] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        currentStatus: true,
        owner: true,
        reports: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.statusDefinition.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.appointment.findMany({
      where: isManagerOrAdmin(session.user.role)
        ? { startAt: { gte: dayStart, lte: dayEnd } }
        : {
            ownerId: session.user.id,
            startAt: { gte: dayStart, lte: dayEnd },
          },
      include: { customer: true, owner: true },
      orderBy: { startAt: "asc" },
      take: 6,
    }),
    isAdminRole(session.user.role)
      ? prisma.user.findMany({
          where: { role: { in: [UserRole.MANAGER, UserRole.SALES] } },
          orderBy: [{ role: "asc" }, { name: "asc" }],
          select: { id: true, name: true, username: true },
        })
      : session.user.role === "MANAGER"
        ? prisma.user.findMany({
            where: { role: "SALES", managerId: session.user.id },
            orderBy: { name: "asc" },
            select: { id: true, name: true, username: true },
          })
        : Promise.resolve([]),
  ]);
  const customerIds = customers.map((c) => c.id);
  const nicknames = customers.map((c) => c.wechatNickname);

  /** 客户列表「下次预约」：优先未开始的最早一条；若均已过期则显示最近一次已排期（避免误以为未预约） */
  const appointmentsForCustomerList =
    customerIds.length === 0
      ? []
      : await prisma.appointment.findMany({
          where: {
            OR: [{ customerId: { in: customerIds } }, { participantName: { in: nicknames } }],
          },
          include: { customer: true, owner: true },
          orderBy: { startAt: "asc" },
        });

  const appointmentOwnerIds = Array.from(new Set(appointments.map((item) => item.ownerId)));
  const ownerColorMap = new Map(
    appointmentOwnerIds.map((ownerId, index) => [ownerId, getOwnerColor(index)]),
  );

  const appointmentsByCustomerId = new Map<string, typeof appointmentsForCustomerList>();
  for (const appointment of appointmentsForCustomerList) {
    const matchedCustomerId =
      appointment.customerId ??
      customers.find((customer) => customer.wechatNickname === appointment.participantName)?.id;

    if (!matchedCustomerId) continue;

    const bucket = appointmentsByCustomerId.get(matchedCustomerId) ?? [];
    bucket.push(appointment);
    appointmentsByCustomerId.set(matchedCustomerId, bucket);
  }

  const nextAppointmentByCustomer = new Map<string, (typeof appointmentsForCustomerList)[number]>();
  for (const customer of customers) {
    const list = appointmentsByCustomerId.get(customer.id);
    if (!list?.length) continue;

    const upcoming = list.find((a) => a.startAt >= now);
    if (upcoming) {
      nextAppointmentByCustomer.set(customer.id, upcoming);
    } else {
      nextAppointmentByCustomer.set(customer.id, list[list.length - 1]);
    }
  }

  const statusCounts = statuses.map((status) => ({
    ...status,
    count: customers.filter((customer) => customer.currentStatusId === status.id).length,
  }));

  return {
    session,
    customers: customers.map((customer) => ({
      ...customer,
      nextAppointment: nextAppointmentByCustomer.get(customer.id) ?? null,
    })),
    statusCounts,
    appointments: appointments.map((appointment) => ({
      ...appointment,
      ownerColor: ownerColorMap.get(appointment.ownerId) ?? "#f59e0b",
    })),
    primaryAssessment,
    assignableSales,
  };
}

export async function getCustomerWorkspace(customerId: string) {
  const session = await requireSession();
  if (!session?.user?.id) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      owner: true,
      currentStatus: true,
      reports: { orderBy: { createdAt: "desc" }, take: 1 },
      followUps: { orderBy: { createdAt: "desc" }, include: { author: true } },
      appointments: { orderBy: { startAt: "asc" }, include: { owner: true } },
      statusTransitions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { fromStatus: true, toStatus: true },
      },
      supplementalScripts: {
        orderBy: { createdAt: "desc" },
        include: { author: true },
      },
      assessments: {
        orderBy: { submittedAt: "desc" },
        take: 1,
        include: { template: true },
      },
    },
  });

  if (!customer) return null;
  if (!isManagerOrAdmin(session.user.role) && customer.ownerId !== session.user.id) {
    return null;
  }

  const report = customer.reports[0];
  const reportData = report
    ? parseJson<
        AssessmentReport & {
          salesSummary?: { headline: string; weakestDimension: string; riskSignal: string };
        } | null
      >(report.reportData, null)
    : null;
  const parentRadar = report
    ? parseJson<Array<{ dimension: string; score: number; fullMark: number }>>(report.parentRadarData, [])
    : [];
  const childRadar = report
    ? parseJson<Array<{ dimension: string; score: number; fullMark: number }>>(report.childRadarData, [])
    : [];

  const currentStage = customer.currentStatus?.name ?? "待跟进";
  const weakestDimension = reportData?.salesSummary?.weakestDimension ?? "沟通";
  const parentType = reportData?.parentType?.name ?? "未识别";
  const problem = customer.coreProblem ?? "";
  const assessmentTemplateId = customer.assessments[0]?.templateId ?? undefined;

  const knowledgeFilter = assessmentTemplateId ? { assessmentTemplateId } : {};
  const dimensionNames =
    reportData && Array.isArray(reportData.dimensionScores) && reportData.dimensionScores.length > 0
      ? reportData.dimensionScores.map((d) => d.name)
      : ["需求", "接纳情绪", "沟通", "家庭系统", "自律", "自主"];

  const knowledgeResults = await Promise.all([
    retrieveKnowledge({
      query: `${weakestDimension} ${problem} ${parentType} 的测评解读 家庭风险 沟通策略`,
      categories: ["测评解读库"],
      limit: 8,
      ...knowledgeFilter,
    }),
    retrieveKnowledge({
      query: `${weakestDimension} ${problem} 对应课程模块和学习帮助`,
      categories: ["课程体系库"],
      limit: 2,
      ...knowledgeFilter,
    }),
    retrieveKnowledge({
      query: `${weakestDimension} ${currentStage} 阶段如何沟通和解读`,
      categories: ["专家话术库"],
      limit: 3,
      ...knowledgeFilter,
    }),
    retrieveKnowledge({
      query: `${currentStage} 阶段不该怎么说，避免反感`,
      categories: ["禁用表达库"],
      limit: 2,
      ...knowledgeFilter,
    }),
    retrieveKnowledge({
      query: `${parentType} ${weakestDimension} 话术语气和田老师风格`,
      categories: ["关键词与风格库"],
      limit: 2,
      ...knowledgeFilter,
    }),
    retrieveKnowledge({
      query: `${weakestDimension} ${problem} 成功案例`,
      categories: ["案例库"],
      limit: 2,
      ...knowledgeFilter,
    }),
  ]);

  const interpretationDeskTemplate = await retrieveKnowledgeChunksForDocument({
    category: "测评解读库",
    /** 知识库管理 · 测评解读库 ·《解读台模版.pdf》 */
    titleContains: "解读台模版",
    assessmentTemplateId,
  });

  /** 工作台「家长类型 + 六维高中低」：在测评解读库按类型/分档精确取句，不再用向量拼接 */
  const kbWorkspaceInterpretation =
    reportData && Array.isArray(reportData.dimensionScores) && reportData.dimensionScores.length > 0
      ? await buildKbWorkspaceInterpretation({
          parentTypeName: reportData.parentType?.name ?? "",
          dimensionScores: reportData.dimensionScores,
          assessmentTemplateId,
        })
      : null;

  const interpretationByDimension = dimensionNames.map(() => [] as RetrievedKnowledge[]);

  return {
    session,
    customer,
    reportData,
    parentRadar:
      parentRadar.length && reportData
        ? parentRadar
        : reportData && typeof reportData === "object"
          ? toRadarData(reportData, "parent")
          : parentRadar,
    childRadar:
      childRadar.length && reportData
        ? childRadar
        : reportData && typeof reportData === "object"
          ? toRadarData(reportData, "child")
          : childRadar,
    statuses: await prisma.statusDefinition.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: "asc" },
    }),
    persona:
      (await prisma.personaProfile.findUnique({ where: { userId: customer.ownerId } })) ?? null,
    templates: await prisma.scriptTemplate.findMany({
      where: {
        approvalState: "approved",
        OR: [{ authorId: null }, { authorId: customer.ownerId }],
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      take: 12,
    }),
    knowledge: {
      interpretation: knowledgeResults[0],
      courses: knowledgeResults[1],
      scripts: knowledgeResults[2],
      forbidden: knowledgeResults[3],
      style: knowledgeResults[4],
      cases: knowledgeResults[5],
      interpretationByDimension,
      interpretationDeskTemplate,
    },
    kbWorkspaceInterpretation,
  };
}

export async function getCalendarView(
  activeMonth = new Date(),
  selectedDate?: string,
  selectedAppointmentId?: string,
) {
  const session = await requireSession();
  if (!session?.user?.id) return null;

  const monthStart = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
  const monthEnd = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0, 23, 59, 59);

  const visibleOwners = isAdminRole(session.user.role)
    ? await prisma.user.findMany({
        where: { role: { in: [UserRole.MANAGER, UserRole.SALES] } },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      })
    : session.user.role === "MANAGER"
      ? await prisma.user.findMany({
          where: {
            OR: [{ id: session.user.id }, { managerId: session.user.id }],
          },
          orderBy: [{ role: "asc" }, { name: "asc" }],
        })
      : await prisma.user.findMany({
          where: { id: session.user.id },
        });

  const ownerColorMap = new Map(
    visibleOwners.map((owner, index) => [owner.id, { name: owner.name, color: getOwnerColor(index) }]),
  );

  const appointments = await prisma.appointment.findMany({
    where: {
      ownerId: { in: visibleOwners.map((owner) => owner.id) },
      startAt: { gte: monthStart, lte: monthEnd },
    },
    include: { customer: true, owner: true },
    orderBy: { startAt: "asc" },
  });

  const normalized = appointments.map((appointment) => ({
    id: appointment.id,
    customerName: appointment.customer?.wechatNickname ?? appointment.participantName ?? "内部安排",
    title: appointment.title,
    kind: appointment.kind,
    ownerName: appointment.owner.name,
    ownerColor: ownerColorMap.get(appointment.ownerId)?.color ?? "#64748b",
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    notes: appointment.notes,
  }));

  return {
    session,
    activeMonth,
    selectedDate:
      selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
        ? selectedDate
        : new Date().toISOString().slice(0, 10),
    owners: visibleOwners.map((owner, index) => ({
      id: owner.id,
      name: owner.name,
      color: getOwnerColor(index),
    })),
    appointments: normalized,
    weeks: buildMonthCalendar(activeMonth, normalized),
    selectedAppointment:
      selectedAppointmentId
        ? appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null
        : null,
    customers: isManagerOrAdmin(session.user.role)
      ? await prisma.customer.findMany({
          select: { id: true, wechatNickname: true, ownerId: true },
          orderBy: { submittedAt: "desc" },
          take: 30,
        })
      : await prisma.customer.findMany({
          where: { ownerId: session.user.id },
          select: { id: true, wechatNickname: true, ownerId: true },
          orderBy: { submittedAt: "desc" },
          take: 30,
        }),
  };
}

export async function getKnowledgeOverview(search?: { q?: string; category?: string }) {
  const session = await requireManagerSession();
  if (!session?.user?.id) return null;

  const q = search?.q?.trim() ?? "";
  const category =
    search?.category && knowledgeCategories.includes(search.category as (typeof knowledgeCategories)[number])
      ? search.category
      : "";

  const documents = await prisma.knowledgeDocument.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { rawText: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    // 列表不返回 rawText，避免单条知识体积过大拖垮页面；检索仍可按 rawText 过滤
    select: {
      id: true,
      title: true,
      summary: true,
      category: true,
      tagsJson: true,
      sourceType: true,
      enabled: true,
      fileName: true,
      metadataJson: true,
      createdAt: true,
      createdBy: true,
      assessmentTemplate: true,
      chunks: {
        orderBy: { chunkIndex: "asc" },
        take: 2,
        select: {
          id: true,
          chunkIndex: true,
          content: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const categoryCounts = await prisma.knowledgeDocument.groupBy({
    by: ["category"],
    _count: { _all: true },
  });

  const templates = await prisma.assessmentTemplate.findMany({
    where: { enabled: true },
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
  });

  return {
    documents,
    templates,
    q,
    category,
    categoryCounts,
  };
}

export async function getKnowledgeCategoryPageData(slug: string) {
  const category = categoryFromSlug(slug);
  if (!category) return null;

  const session = await requireManagerSession();
  if (!session?.user?.id) return null;

  const [documents, templates] = await Promise.all([
    prisma.knowledgeDocument.findMany({
      where: { category },
      orderBy: { createdAt: "desc" },
      // 列表页不要 select rawText：大 PDF 文本可达数 MB，会撑爆 RSC 响应导致 500
      select: {
        id: true,
        title: true,
        summary: true,
        tagsJson: true,
        sourceType: true,
        enabled: true,
        fileName: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { name: true } },
        assessmentTemplate: { select: { id: true, title: true } },
      },
    }),
    prisma.assessmentTemplate.findMany({
      where: { enabled: true },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  return { category, documents, templates, slug };
}

export async function getKnowledgeDocumentForEdit(id: string) {
  const session = await requireManagerSession();
  if (!session?.user?.id) return null;

  const document = await prisma.knowledgeDocument.findUnique({
    where: { id },
    include: {
      assessmentTemplate: { select: { id: true, title: true } },
      createdBy: { select: { name: true } },
    },
  });

  if (!document) return null;
  if (!knowledgeCategories.includes(document.category as (typeof knowledgeCategories)[number])) {
    return null;
  }

  const templates = await prisma.assessmentTemplate.findMany({
    where: { enabled: true },
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
  });

  return { document, session, templates };
}

export async function getAssessmentManagementData() {
  const session = await requireManagerSession();
  if (!session?.user?.id) return null;

  const templates = await prisma.assessmentTemplate.findMany({
    include: {
      createdBy: true,
      _count: {
        select: {
          submissions: true,
          knowledgeDocuments: true,
        },
      },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });

  return { templates };
}

async function loadAdminOrganizationOverview() {
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER" },
    orderBy: { name: "asc" },
  });
  const salesUsersRaw = await prisma.user.findMany({
    where: { role: "SALES" },
    include: { manager: { select: { id: true, name: true, username: true } } },
    orderBy: { name: "asc" },
  });
  const managerIds = managers.map((m) => m.id);
  const salesIds = salesUsersRaw.map((s) => s.id);
  const ownerIds = [...new Set([...managerIds, ...salesIds])];

  const [customers, appointments, pendingScripts, statuses] = await Promise.all([
    prisma.customer.findMany({
      where: { ownerId: { in: ownerIds } },
      include: { owner: true, currentStatus: true },
    }),
    prisma.appointment.findMany({
      where: { ownerId: { in: ownerIds } },
    }),
    salesIds.length
      ? prisma.supplementalScript.findMany({
          where: {
            approvedToTemplate: false,
            authorId: { in: salesIds },
          },
          include: { customer: true, author: true },
          orderBy: { createdAt: "desc" },
          take: 12,
        })
      : Promise.resolve([]),
    prisma.statusDefinition.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const bySales = salesUsersRaw.map((user) => {
    const owned = customers.filter((c) => c.ownerId === user.id);
    return {
      user,
      managerName: user.manager?.name ?? "—",
      total: owned.length,
      paid: owned.filter((item) => item.currentStatus?.code === "paid").length,
      liveAttended: owned.filter((item) => item.currentStatus?.code === "live_attended").length,
      liveMissed: owned.filter((item) => item.currentStatus?.code === "live_missed").length,
      bookedConsult: owned.filter((item) => item.currentStatus?.code === "booked_consult").length,
    };
  });

  const funnel = statuses.map((status) => ({
    name: status.name,
    code: status.code,
    color: status.color,
    count: customers.filter((c) => c.currentStatusId === status.id).length,
  }));

  return {
    view: "admin" as const,
    managers,
    salesUsers: bySales,
    rawSalesUsers: salesUsersRaw,
    pendingScripts,
    funnel,
    totalCustomers: customers.length,
    metrics: {
      bookedConsult: customers.filter((item) => item.currentStatus?.code === "booked_consult").length,
      consultDone: customers.filter((item) => item.currentStatus?.code === "consult_done").length,
      liveBooked: customers.filter((item) => item.currentStatus?.code === "live_booked").length,
      liveAttended: customers.filter((item) => item.currentStatus?.code === "live_attended").length,
      liveMissed: customers.filter((item) => item.currentStatus?.code === "live_missed").length,
      trialDone: customers.filter((item) => item.currentStatus?.code === "trial_done").length,
      paid: customers.filter((item) => item.currentStatus?.code === "paid").length,
      refunded: customers.filter((item) => item.currentStatus?.code === "refunded").length,
      todayAppointments: appointments.filter((item) => {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return item.startAt >= start && item.startAt <= end;
      }).length,
    },
  };
}

export async function getManagerOverview() {
  const session = await requireSession();
  if (!session?.user?.id) return null;
  if (session.user.role === "ADMIN") {
    return loadAdminOrganizationOverview();
  }
  if (session.user.role !== "MANAGER") return null;

  const [salesUsers, statuses] = await Promise.all([
    prisma.user.findMany({
      where: { role: "SALES", managerId: session.user.id },
      orderBy: { name: "asc" },
    }),
    prisma.statusDefinition.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const ownerIds = [session.user.id, ...salesUsers.map((user) => user.id)];
  const [customers, appointments, pendingScripts] = await Promise.all([
    prisma.customer.findMany({
      where: { ownerId: { in: ownerIds } },
      include: {
        owner: true,
        currentStatus: true,
      },
    }),
    prisma.appointment.findMany({
      where: { ownerId: { in: ownerIds } },
    }),
    prisma.supplementalScript.findMany({
      where: {
        approvedToTemplate: false,
        authorId: { in: salesUsers.map((user) => user.id) },
      },
      include: {
        customer: true,
        author: true,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const bySales = salesUsers.map((user) => {
    const owned = customers.filter((customer) => customer.ownerId === user.id);
    return {
      user,
      managerName: undefined as string | undefined,
      total: owned.length,
      paid: owned.filter((item) => item.currentStatus?.code === "paid").length,
      liveAttended: owned.filter((item) => item.currentStatus?.code === "live_attended").length,
      liveMissed: owned.filter((item) => item.currentStatus?.code === "live_missed").length,
      bookedConsult: owned.filter((item) => item.currentStatus?.code === "booked_consult").length,
    };
  });

  const funnel = statuses.map((status) => ({
    name: status.name,
    code: status.code,
    color: status.color,
    count: customers.filter((customer) => customer.currentStatusId === status.id).length,
  }));

  return {
    view: "manager" as const,
    managers: [],
    salesUsers: bySales,
    rawSalesUsers: salesUsers,
    pendingScripts,
    funnel,
    totalCustomers: customers.length,
    metrics: {
      bookedConsult: customers.filter((item) => item.currentStatus?.code === "booked_consult").length,
      consultDone: customers.filter((item) => item.currentStatus?.code === "consult_done").length,
      liveBooked: customers.filter((item) => item.currentStatus?.code === "live_booked").length,
      liveAttended: customers.filter((item) => item.currentStatus?.code === "live_attended").length,
      liveMissed: customers.filter((item) => item.currentStatus?.code === "live_missed").length,
      trialDone: customers.filter((item) => item.currentStatus?.code === "trial_done").length,
      paid: customers.filter((item) => item.currentStatus?.code === "paid").length,
      refunded: customers.filter((item) => item.currentStatus?.code === "refunded").length,
      todayAppointments: appointments.filter((item) => {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return item.startAt >= start && item.startAt <= end;
      }).length,
    },
  };
}

/** 通话管理列表页：录音列表 + 可关联客户下拉数据 */
export async function getCallRecordingsPageData() {
  const session = await requireSession();
  if (!session?.user?.id) return null;

  const [items, customers] = await Promise.all([
    prisma.callRecording.findMany({
      where: callRecordingListWhere(session),
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        customer: { select: { id: true, wechatNickname: true } },
        owner: { select: { id: true, name: true } },
      },
    }),
    prisma.customer.findMany({
      where: isManagerOrAdmin(session.user.role) ? {} : { ownerId: session.user.id },
      select: { id: true, wechatNickname: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
  ]);

  return { session, items, customers };
}

export async function getCallRecordingDetail(recordingId: string) {
  const session = await requireSession();
  if (!session?.user?.id) return null;

  const recording = await prisma.callRecording.findFirst({
    where: { id: recordingId, ...callRecordingListWhere(session) },
    include: {
      customer: { select: { id: true, wechatNickname: true, phone: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  if (!recording) return null;
  return { session, recording };
}
