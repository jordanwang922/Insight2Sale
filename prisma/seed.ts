import { loadDotenvFromRoot } from "../scripts/load-dotenv";
loadDotenvFromRoot();

import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import {
  anxietyQuestions,
  burnoutQuestions,
  competenceQuestions,
  coreQuestions,
} from "../src/features/assessment/questions";
import { buildSalesSummary, toRadarData } from "../src/features/assessment/report";
import { scoreAssessment } from "../src/features/assessment/scoring";
import { AssessmentAnswer } from "../src/features/assessment/types";
import { buildKnowledgeChunks } from "../src/features/knowledge/ingestion";
import { getActiveEmbeddingModelLabel } from "../src/lib/ai/ark-embedding";
import { getDefaultNewUserPassword } from "../src/config/default-credentials";

const prisma = new PrismaClient();

const statuses = [
  ["new_lead", "新线索", "#6b7280", 10],
  ["assessment_sent", "已发送测评", "#c084fc", 20],
  ["assessment_done", "已完成测评", "#8b5cf6", 30],
  ["awaiting_booking", "待预约解读", "#f59e0b", 40],
  ["booked_consult", "已预约解读", "#f97316", 50],
  ["consult_done", "已完成解读", "#14b8a6", 60],
  ["live_booked", "已预约直播", "#0ea5e9", 70],
  ["live_attended", "已到课", "#22c55e", 80],
  ["live_missed", "未到课", "#ef4444", 90],
  ["trial_done", "已试听", "#10b981", 100],
  ["pending_close", "待成交跟进", "#0891b2", 110],
  ["paid", "已付款", "#16a34a", 120],
  ["refunded", "已退款", "#b91c1c", 130],
  ["paused", "暂停跟进", "#64748b", 140],
  ["invalid", "无效客户", "#475569", 150],
] as const;

function pickOptionByScore(
  options: Array<{ label: string; score: number }>,
  targetScore: number,
) {
  return (
    options.find((option) => option.score === targetScore) ??
    options.reduce((closest, current) =>
      Math.abs(current.score - targetScore) < Math.abs(closest.score - targetScore)
        ? current
        : closest,
    )
  );
}

function buildDemoAnswers(profile: {
  childDimensionTargets: Record<string, number>;
  parentDimensionTargets: Record<string, number>;
  anxietyScore: number;
  burnoutScore: number;
  competenceScore: number;
}): AssessmentAnswer[] {
  return [
    ...coreQuestions.map((question) => {
      const targetScore =
        question.type === "child"
          ? profile.childDimensionTargets[question.dimension] ?? 3
          : profile.parentDimensionTargets[question.dimension] ?? 3;
      const option = pickOptionByScore(question.options, targetScore);

      return {
        questionId: question.id,
        selectedOption: option.label,
        score: option.score,
      };
    }),
    ...anxietyQuestions.map((question) => {
      const option = pickOptionByScore(question.options, profile.anxietyScore);
      return { questionId: question.id, selectedOption: option.label, score: option.score };
    }),
    ...burnoutQuestions.map((question) => {
      const option = pickOptionByScore(question.options, profile.burnoutScore);
      return { questionId: question.id, selectedOption: option.label, score: option.score };
    }),
    ...competenceQuestions.map((question) => {
      const option = pickOptionByScore(question.options, profile.competenceScore);
      return { questionId: question.id, selectedOption: option.label, score: option.score };
    }),
  ];
}

async function main() {
  const passwordHash = await bcrypt.hash(getDefaultNewUserPassword(), 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@insight2sale.local",
      name: "系统管理员",
      passwordHash,
      role: UserRole.ADMIN,
      defaultPassword: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@insight2sale.local" },
    update: {
      username: "tianmanager",
      defaultPassword: true,
      adminId: admin.id,
    },
    create: {
      username: "tianmanager",
      email: "manager@insight2sale.local",
      name: "田老师团队主管",
      passwordHash,
      role: UserRole.MANAGER,
      adminId: admin.id,
      defaultPassword: true,
      personaProfile: {
        create: {
          displayTitle: "帆书家庭教育总监",
          introHeadline: "专注科学养育与销售解读体系搭建",
          expertiseSummary: "负责销售团队方法论、测评解读和课程衔接策略。",
          trustSignal: "持续陪伴团队优化高转化解读路径",
          openingStyle: "专业、温和、确定",
          inviteStyle: "先建立信任，再锁定资源",
        },
      },
    },
  });

  const salesUsers = await Promise.all(
    [
      ["顾问周岚", "sales1@insight2sale.local", "zhoulan"],
      ["顾问许宁", "sales2@insight2sale.local", "xuning"],
    ].map(([name, email, username]) =>
      prisma.user.upsert({
        where: { email },
        update: { managerId: manager.id, username, defaultPassword: true },
        create: {
          username,
          email,
          name,
          passwordHash,
          role: UserRole.SALES,
          defaultPassword: true,
          managerId: manager.id,
          personaProfile: {
            create: {
              displayTitle: "帆书家庭教育顾问",
              introHeadline: "帮助家长看懂测评结果，并找到孩子成长的突破口",
              expertiseSummary:
                "擅长围绕亲子沟通、规则、自驱和学习问题，完成 1V1 解读与课程引导。",
              trustSignal: "累计陪伴上百位家长进行测评解读",
              openingStyle: "共情式开场，强调共同看报告",
              inviteStyle: "锁定专属时间，突出 1V1 资源价值",
            },
          },
        },
      }),
    ),
  );

  for (const [code, name, color, sortOrder] of statuses) {
    await prisma.statusDefinition.upsert({
      where: { code },
      update: { name, color, sortOrder, enabled: true },
      create: {
        code,
        name,
        color,
        sortOrder,
        enabled: true,
        isDefault: code === "new_lead",
        inPrimaryFunnel: !["paused", "invalid", "refunded"].includes(code),
        manualAllowed: true,
      },
    });
  }

  const awaiting = await prisma.statusDefinition.findUniqueOrThrow({
    where: { code: "awaiting_booking" },
  });

  const primaryAssessment = await prisma.assessmentTemplate.upsert({
    where: { slug: "smart-parenting-core" },
    update: {
      isPrimary: true,
      enabled: true,
      title: "智慧父母养育测评",
      shortName: "智慧父母养育测评",
      description: "用于家长前端 H5 填写的主推测评，完成后生成双雷达图、家长类型与销售解读报告。",
      introTitle: "家长养育能力与孩子成长潜能匹配度评估",
      introBody: "基于田宏杰《智慧父母科学养育计划》的专业测评工具。",
      reportOutlineJson: JSON.stringify([]),
      configJson: JSON.stringify({
        runtime: "builtin-parenting-v1",
        questionCount: 45,
      }),
    },
    create: {
      slug: "smart-parenting-core",
      isPrimary: true,
      enabled: true,
      sourceType: "builtin",
      title: "智慧父母养育测评",
      shortName: "智慧父母养育测评",
      description: "用于家长前端 H5 填写的主推测评，完成后生成双雷达图、家长类型与销售解读报告。",
      introTitle: "家长养育能力与孩子成长潜能匹配度评估",
      introBody: "基于田宏杰《智慧父母科学养育计划》的专业测评工具。",
      reportOutlineJson: JSON.stringify([]),
      configJson: JSON.stringify({
        runtime: "builtin-parenting-v1",
        questionCount: 45,
      }),
      createdById: manager.id,
    },
  });

  await prisma.assessmentTemplate.updateMany({
    where: { NOT: { id: primaryAssessment.id } },
    data: { isPrimary: false },
  });

  for (const template of [
    {
      category: "intro",
      title: "标准专家开场",
      content:
        "家长您好，我是帆书家庭教育顾问。今天这次解读，我们会一起看您和孩子的测评结果，重点不是评判，而是帮您看清楚当下的问题和后续可以怎么走。",
      source: "system",
      applicableStage: "booked_consult",
    },
    {
      category: "course-hook",
      title: "自律维度挂钩模块五",
      content:
        "从这份报告看，孩子在自律这块并不是不想好，而是还没有形成稳定的自我管理结构。我们正课里“科学激励”会专门讲怎样把催促、盯防，慢慢转成孩子自己愿意坚持的机制。",
      source: "system",
      applicableDimension: "自律",
      applicableStage: "consult_done",
    },
  ]) {
    const existing = await prisma.scriptTemplate.findFirst({
      where: {
        title: template.title,
        source: template.source,
      },
    });

    if (!existing) {
      await prisma.scriptTemplate.create({
        data: template,
      });
    }
  }

  const seedKnowledgeDocs = [
    {
      title: "模块五科学激励与自律问题衔接",
      category: "课程体系库",
      rawText:
        "模块五科学激励重点解决孩子自律弱、总要催、执行断断续续的问题。课程重点不是继续加压，而是帮助家长建立目标、反馈和激励闭环，把外部盯防慢慢转成孩子的内部坚持。适用于孩子做事拖拉、写作业磨蹭、需要不断提醒的场景。",
      tags: ["自律", "模块五", "课程衔接"],
    },
    {
      title: "双高双低与高低错位的解读原则",
      category: "测评解读库",
      rawText:
        "双高代表孩子已有表现，也离不开家长持续且稳定的支持。双低代表孩子还没建立能力，家长端也缺少有效抓手，需要先从家长训练开始。家长高孩子低时，要警惕要求高于孩子当前能力带来的挫败感。家长低孩子高时，说明孩子已有潜力，家长需要升级支持和承接方式。",
      tags: ["双高", "双低", "测评解读"],
    },
    {
      title: "解读开场与课程衔接标准话术",
      category: "专家话术库",
      rawText:
        "开场先说：今天我们一起看报告，重点不是评判，而是看清孩子卡在哪里、家长还能怎么帮。指出薄弱维度后，不要立刻推课，要先让家长觉得被理解，再自然讲课程模块能解决什么。衔接课程时多说为什么是这个模块，少说价格和购买。",
      tags: ["开场", "课程衔接", "1V1"],
    },
    {
      title: "自律薄弱客户的典型转化案例",
      category: "案例库",
      rawText:
        "一位家长反馈孩子写作业全程靠催，自律维度明显偏低。解读时先共情家长的疲惫，再解释这不是孩子不想好，而是缺少稳定结构。随后衔接模块五科学激励，重点讲从外控转内驱的路径，最后约到直播体验课，家长接受度明显提升。",
      tags: ["案例", "自律", "直播转化"],
    },
    {
      title: "解读时避免使用的高压表达",
      category: "禁用表达库",
      rawText:
        "不要说孩子就是自控差、你现在的方法肯定不行、再不学就晚了。也不要过早说必须报课、你问题很严重。容易引发家长防御的表达都要避免，先共情，再解释，再给方法。",
      tags: ["禁用表达", "防御", "反感"],
    },
    {
      title: "田老师体系的关键词与风格要求",
      category: "关键词与风格库",
      rawText:
        "整体风格要专业、温和、确定，强调看懂孩子、接住情绪、建立结构、从外控到内驱。避免训斥式、居高临下式和强销售式表达。优先使用共情、承接、引导、看见、支持、结构这些关键词。",
      tags: ["风格", "关键词", "田老师"],
    },
  ] as const;

  for (const document of seedKnowledgeDocs) {
    const exists = await prisma.knowledgeDocument.findFirst({
      where: {
        title: document.title,
        category: document.category,
      },
    });

    if (!exists) {
      const chunks = await buildKnowledgeChunks(document.rawText);
      await prisma.knowledgeDocument.create({
        data: {
          title: document.title,
          category: document.category,
          sourceType: "seed",
          rawText: document.rawText,
          summary: document.rawText.slice(0, 120),
          tagsJson: JSON.stringify(document.tags),
          metadataJson: JSON.stringify({
            chunkCount: chunks.length,
            embeddingModel: getActiveEmbeddingModelLabel(),
          }),
          assessmentTemplateId: primaryAssessment.id,
          createdById: manager.id,
          chunks: {
            create: chunks,
          },
        },
      });
    }
  }

  const demoCustomers = [
    {
      wechatNickname: "快乐女孩",
      phone: "18300000001",
      memberStatus: "不是",
      gender: "女",
      education: "大学本科",
      ageRange: "36-40岁",
      childrenCount: "2个",
      childAgeRanges: JSON.stringify(["10-12岁"]),
      decisionMakerCount: "2人协商",
      primaryCaretaker: "孩子妈妈",
      parentingRole: "职场妈妈/爸爸（兼顾工作与育儿）",
      occupationCategory: "医疗行业",
      occupationDetail: "医院行政",
      source: "微信",
      sourceDetail: "N/A",
      ipLocation: "广东深圳",
      totalScore: 107,
      completionSeconds: 1697,
      submittedAt: new Date("2026-04-01T15:41:07+08:00"),
      coreProblem: "孩子的情绪、手机问题，担心他的身体和学习",
      coreConcern: "担心如果一直这样下去，孩子学习会越来越被动，也影响亲子关系",
      attemptedActions: "让她先学习再看电视，说了就能听，不说就忘了",
      attemptedOutcome: "尝试改变沟通方式，但效果不明显",
      desiredSupport: "与我1V1时，针对我的问题，多多指导我，给我建议",
      demoProfile: {
        childDimensionTargets: {
          需求: 3,
          接纳情绪: 1,
          沟通: 3,
          家庭系统: 3,
          自律: 1,
          自主: 3,
        },
        parentDimensionTargets: {
          需求: 3,
          接纳情绪: 1,
          沟通: 3,
          家庭系统: 3,
          自律: 1,
          自主: 3,
        },
        anxietyScore: 5,
        burnoutScore: 3,
        competenceScore: 1,
      },
    },
    {
      wechatNickname: "午後的咖啡",
      phone: "18300000002",
      memberStatus: "是帆书付费会员",
      gender: "女",
      education: "大学专科",
      ageRange: "31-35岁",
      childrenCount: "1个",
      childAgeRanges: JSON.stringify(["7-9岁", "10-12岁"]),
      decisionMakerCount: "1人主导",
      primaryCaretaker: "孩子妈妈",
      parentingRole: "全职妈妈/爸爸",
      occupationCategory: "全职妈妈/爸爸",
      occupationDetail: "全职妈妈",
      source: "微信",
      sourceDetail: "N/A",
      ipLocation: "山西大同",
      totalScore: 130,
      completionSeconds: 832,
      submittedAt: new Date("2026-04-01T10:34:57+08:00"),
      coreProblem: "最近孩子自我意识爆棚，很难沟通",
      coreConcern: "担心后面越来越叛逆，不再愿意和我说心里话",
      attemptedActions: "学了帆书里的家庭教育书，有一些效果，就是会和孩子复盘",
      attemptedOutcome: "有改善，但还不稳定",
      desiredSupport: "如何系统学习，推荐课程",
      demoProfile: {
        childDimensionTargets: {
          需求: 5,
          接纳情绪: 3,
          沟通: 1,
          家庭系统: 3,
          自律: 3,
          自主: 5,
        },
        parentDimensionTargets: {
          需求: 5,
          接纳情绪: 3,
          沟通: 1,
          家庭系统: 3,
          自律: 3,
          自主: 5,
        },
        anxietyScore: 3,
        burnoutScore: 1,
        competenceScore: 3,
      },
    },
  ];

  for (let index = 0; index < demoCustomers.length; index += 1) {
    const customer = demoCustomers[index];
    const { demoProfile, ...customerData } = customer;
    const savedCustomer = await prisma.customer.upsert({
      where: { phone: customer.phone },
      update: {},
      create: {
        ownerId: salesUsers[index % salesUsers.length].id,
        currentStatusId: awaiting.id,
        ...customerData,
      },
    });

    const reportCount = await prisma.reportSnapshot.count({
      where: { customerId: savedCustomer.id },
    });

    if (!reportCount) {
      const answers = buildDemoAnswers(demoProfile);
      const report = scoreAssessment(answers);
      const submission = await prisma.assessmentSubmission.create({
        data: {
          customerId: savedCustomer.id,
          version: "demo-seed-v1",
          templateId: primaryAssessment.id,
          totalScore: report.overallScore,
          answersData: JSON.stringify(answers),
          intakeData: JSON.stringify({
            wechatNickname: savedCustomer.wechatNickname,
            phone: savedCustomer.phone,
          }),
        },
      });

      const reportWithSummary = {
        ...report,
        salesSummary: buildSalesSummary(report, savedCustomer.wechatNickname),
      };

      await prisma.reportSnapshot.create({
        data: {
          customerId: savedCustomer.id,
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
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
