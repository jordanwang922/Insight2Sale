import { describe, expect, it } from "vitest";
import type { Session } from "next-auth";
import { callRecordingListWhere } from "@/features/crm/call-recording-access";
import { parseHighlightsJson } from "@/features/crm/call-recording-process";

function mockSession(role: "MANAGER" | "SALES" | "ADMIN", userId: string): Session {
  return {
    expires: new Date(Date.now() + 86400000).toISOString(),
    user: {
      id: userId,
      name: "测试用户",
      email: "test@example.com",
      role,
    },
  } as Session;
}

describe("callRecordingListWhere", () => {
  it("销售仅查询本人 ownerId", () => {
    const w = callRecordingListWhere(mockSession("SALES", "sales-a"));
    expect(w).toEqual({ ownerId: "sales-a" });
  });

  it("主管查询本人或下属销售的录音", () => {
    const w = callRecordingListWhere(mockSession("MANAGER", "mgr-1"));
    expect(w).toEqual({
      OR: [{ ownerId: "mgr-1" }, { owner: { managerId: "mgr-1" } }],
    });
  });

  it("管理员可查询全组织录音", () => {
    const w = callRecordingListWhere(mockSession("ADMIN", "admin-1"));
    expect(w).toEqual({});
  });
});

describe("parseHighlightsJson", () => {
  it("解析合法 JSON 数组", () => {
    expect(parseHighlightsJson('["a","b"]')).toEqual(["a", "b"]);
  });

  it("非法输入返回空数组", () => {
    expect(parseHighlightsJson("")).toEqual([]);
    expect(parseHighlightsJson("not-json")).toEqual([]);
  });
});
