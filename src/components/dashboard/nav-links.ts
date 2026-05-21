import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  PhoneCall,
  Settings,
  BarChart3,
  LibraryBig,
  DatabaseZap,
  ClipboardList,
  PieChart,
  Sparkles,
  Megaphone,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { isManagerOrAdmin } from "@/lib/role-access";

export interface DashboardNavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

const links: DashboardNavLink[] = [
  { href: "/dashboard", label: "工作台", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "客户管理", icon: Users },
  { href: "/dashboard/calendar", label: "预约日历", icon: CalendarDays },
  { href: "/dashboard/call-recordings", label: "通话管理", icon: PhoneCall },
  { href: "/dashboard/deal-kits", label: "成交锦囊", icon: Sparkles },
  { href: "/dashboard/promotion-copies", label: "推广文案", icon: Megaphone },
  { href: "/dashboard/manager", label: "主管总览", icon: BarChart3 },
  { href: "/dashboard/assessment-statistics", label: "测评表统计", icon: PieChart },
  { href: "/dashboard/assessments", label: "测评表管理", icon: ClipboardList },
  { href: "/dashboard/knowledge", label: "知识库管理", icon: DatabaseZap },
  { href: "/dashboard/templates", label: "模板管理", icon: LibraryBig },
  { href: "/dashboard/settings/statuses", label: "状态设置", icon: Settings },
];

const managerOnlyLinks = new Set([
  "/dashboard/manager",
  "/dashboard/assessment-statistics",
  "/dashboard/assessments",
  "/dashboard/knowledge",
  "/dashboard/templates",
  "/dashboard/settings/statuses",
]);

export function getDashboardNavLinks(role?: UserRole | null) {
  if (role && isManagerOrAdmin(role)) {
    return links;
  }

  return links.filter((link) => !managerOnlyLinks.has(link.href));
}
