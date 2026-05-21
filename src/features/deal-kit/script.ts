import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateDoubaoJson } from "@/lib/ai/doubao";
import { buildDealKitScriptFallback } from "@/features/deal-kit/entry";

export interface DealKitScriptGenerationResult {
  status: "success" | "error";
  message: string;
  generatedScript?: string;
  generationId?: string;
}

export async function generateDealKitScriptResult(params: {
  userId: string;
  query: string;
  entryIds: string[];
}): Promise<DealKitScriptGenerationResult> {
  const query = params.query.trim();
  const entryIds = params.entryIds.map((item) => item.trim()).filter(Boolean).slice(0, 3);

  if (!query) {
    return { status: "error", message: "请先输入当前客户的问题。" };
  }
  if (!entryIds.length) {
    return { status: "error", message: "请先勾选 1 到 3 条成交锦囊。" };
  }

  const entries = await prisma.dealKitEntry.findMany({
    where: {
      id: { in: entryIds },
      status: "published",
    },
    orderBy: { createdAt: "asc" },
  });

  if (!entries.length) {
    return { status: "error", message: "选中的成交锦囊不存在或已下线。" };
  }

  const fallback = buildDealKitScriptFallback(entries);
  const result = await generateDoubaoJson<{ script?: string }>({
    system: `你是家庭教育课程销售助手。你会根据若干条已经验证过的成交经验，为销售生成一段临场可说的话术。
只输出 JSON：
{"script":"..."}
要求：
1. 语气自然，像销售顾问和家长电话沟通时能直接说出来的话
2. 先共情，再判断，再推进，不要硬推
3. 保留经验中的关键成交逻辑，但不要逐条照抄
4. 不要写标题，不要分段太多，控制在 220 字以内`,
    user: `客户当前问题：${query}\n\n参考经验：\n${entries
      .map(
        (entry, index) =>
          `【经验${index + 1}】\n用户判断：${entry.judgmentText}\n成交经验：${entry.experienceText}`,
      )
      .join("\n\n")}`,
    temperature: 0.45,
    timeoutMs: 25_000,
    fallback: { script: fallback },
  });

  const generatedScript =
    typeof result.script === "string" && result.script.trim() ? result.script.trim() : fallback;

  try {
    const generation = await prisma.$transaction(async (tx) => {
      const created = await tx.dealKitScriptGeneration.create({
        data: {
          userId: params.userId,
          query,
          generatedScript,
          entryIdsJson: JSON.stringify(entries.map((entry) => entry.id)),
        },
      });

      for (const entry of entries) {
        await tx.dealKitEntry.update({
          where: { id: entry.id },
          data: { citationCount: { increment: 1 } },
        });
      }

      return created;
    });

    revalidatePath("/dashboard/deal-kits");
    return {
      status: "success",
      generatedScript,
      generationId: generation.id,
      message: "成交话术已生成。",
    };
  } catch {
    return {
      status: "success",
      generatedScript,
      message: "成交话术已生成，但这次没有成功记录引用次数。你可以先直接使用和复制话术。",
    };
  }
}
