import { describe, expect, it } from "vitest";
import { stripFileExtension } from "@/components/knowledge/sync-title-from-file";

describe("stripFileExtension", () => {
  it("removes last extension", () => {
    expect(stripFileExtension("【销售手册】《智慧父母·科学养育计划》正课.pdf")).toBe(
      "【销售手册】《智慧父母·科学养育计划》正课",
    );
  });

  it("handles path segments", () => {
    expect(stripFileExtension("/tmp/foo/bar.docx")).toBe("bar");
  });
});
