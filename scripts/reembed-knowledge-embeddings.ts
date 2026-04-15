/**
 * 对已入库的 KnowledgeChunk 按当前 `content` 重新计算向量（方舟 embedding），
 * 并统一 `embeddingModel`、同步文档 `metadataJson.embeddingModel`。
 *
 * 运行前请在 `.env` 中配置：ARK_API_KEY、ARK_BASE_URL、ARK_EMBEDDING_MODEL。
 *
 *   npm run db:reembed-knowledge
 */
import { PrismaClient } from "@prisma/client";
import {
  embedTextsWithArk,
  getActiveEmbeddingModelLabel,
  isArkSemanticEmbeddingConfigured,
  truncateForEmbedding,
} from "../src/lib/ai/ark-embedding";

const prisma = new PrismaClient();
const BATCH = 32;

async function main() {
  if (!isArkSemanticEmbeddingConfigured()) {
    console.error(
      "未配置方舟向量：请设置 ARK_API_KEY、ARK_BASE_URL、ARK_EMBEDDING_MODEL（向量模型接入点 ID）。",
    );
    process.exit(1);
  }

  const model = getActiveEmbeddingModelLabel();
  const rows = await prisma.knowledgeChunk.findMany({
    orderBy: { id: "asc" },
    select: { id: true, documentId: true, content: true },
  });

  if (rows.length === 0) {
    console.log("无知识切片，退出。");
    return;
  }

  console.log(`共 ${rows.length} 条切片，模型标识：${model}`);

  const touchedDocs = new Set<string>();

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const texts = batch.map((r) => truncateForEmbedding(r.content));
    const embeddings = await embedTextsWithArk(texts);

    await prisma.$transaction(
      batch.map((row, j) =>
        prisma.knowledgeChunk.update({
          where: { id: row.id },
          data: {
            embeddingJson: JSON.stringify(embeddings[j]),
            embeddingModel: model,
          },
        }),
      ),
    );

    for (const row of batch) {
      touchedDocs.add(row.documentId);
    }

    console.log(`已处理 ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
  }

  for (const documentId of touchedDocs) {
    const chunkCount = await prisma.knowledgeChunk.count({ where: { documentId } });
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        metadataJson: JSON.stringify({
          chunkCount,
          embeddingModel: model,
        }),
      },
    });
  }

  console.log(`完成：已更新 ${touchedDocs.size} 份文档的 metadata。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
