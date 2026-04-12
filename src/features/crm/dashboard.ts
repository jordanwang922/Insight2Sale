import type { UserRole } from "@prisma/client";

export interface QuickAction {
  key: string;
  label: string;
  href?: string;
  kind: "link" | "copy";
  description?: string;
}

export function getQuickActions(role: UserRole): QuickAction[] {
  const shared: QuickAction[] = [
    {
      key: "assessment-open",
      label: "打开智慧父母养育测评",
      href: "/assessment",
      kind: "link",
    },
    {
      key: "assessment-copy",
      label: "复制智慧父母养育测评",
      href: "/assessment",
      kind: "copy",
    },
    {
      key: "calendar",
      label: "安排新的解读预约",
      href: "/dashboard/calendar",
      kind: "link",
    },
  ];

  if (role === "MANAGER") {
    return [
      ...shared,
      {
        key: "statuses",
        label: "维护客户状态字典",
        href: "/dashboard/settings/statuses",
        kind: "link",
      },
      {
        key: "manager",
        label: "查看团队总览",
        href: "/dashboard/manager",
        kind: "link",
      },
    ];
  }

  return shared;
}
