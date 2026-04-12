import { describe, expect, test } from "vitest";
import { getQuickActions } from "@/features/crm/dashboard";

describe("dashboard quick actions", () => {
  test("shows assessment open and copy actions for sales, without manager-only entries", () => {
    const actions = getQuickActions("SALES");

    expect(actions.map((action) => action.label)).toContain("打开智慧父母养育测评");
    expect(actions.map((action) => action.label)).toContain("复制智慧父母养育测评");
    expect(actions.map((action) => action.label)).not.toContain("维护客户状态字典");
    expect(actions.map((action) => action.label)).not.toContain("查看团队总览");
  });

  test("shows manager-only actions for managers", () => {
    const actions = getQuickActions("MANAGER");

    expect(actions.map((action) => action.label)).toContain("维护客户状态字典");
    expect(actions.map((action) => action.label)).toContain("查看团队总览");
  });
});
