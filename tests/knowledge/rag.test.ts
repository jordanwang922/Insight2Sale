import { describe, expect, test } from "vitest";
import { chunkKnowledgeText, embedText, rankKnowledgeChunks } from "@/features/knowledge/rag";

describe("knowledge rag", () => {
  test("chunks long text into overlapping segments", () => {
    const text = "课程体系".repeat(220);
    const chunks = chunkKnowledgeText(text, 180, 40);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].content.length).toBeLessThanOrEqual(180);
    expect(chunks[1].content.length).toBeLessThanOrEqual(180);
  });

  test("produces normalized vectors", () => {
    const vector = embedText("自律维度需要帮助孩子建立稳定的行为结构");
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

    expect(vector.length).toBeGreaterThan(10);
    expect(magnitude).toBeGreaterThan(0.99);
    expect(magnitude).toBeLessThan(1.01);
  });

  test("ranks semantically close chunks first", () => {
    const queryVector = embedText("孩子自律很差，如何连接课程");
    const ranked = rankKnowledgeChunks(queryVector, [
      {
        id: "c1",
        content:
          "模块五科学激励重点解决孩子自律差、需要不断催促的问题，帮助家长从外控转向内驱。",
        embedding: embedText(
          "模块五科学激励重点解决孩子自律差、需要不断催促的问题，帮助家长从外控转向内驱。",
        ),
      },
      {
        id: "c2",
        content: "安全依恋模块更关注孩子情绪接纳与关系修复。",
        embedding: embedText("安全依恋模块更关注孩子情绪接纳与关系修复。"),
      },
    ]);

    expect(ranked[0]?.id).toBe("c1");
    expect(ranked[0]?.score).toBeGreaterThan(ranked[1]?.score ?? 0);
  });
});
