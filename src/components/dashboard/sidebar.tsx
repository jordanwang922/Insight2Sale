import Link from "next/link";
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
} from "lucide-react";
import { auth } from "@/auth";
import { isManagerOrAdmin } from "@/lib/role-access";

const links = [
  { href: "/dashboard", label: "工作台", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "客户管理", icon: Users },
  { href: "/dashboard/calendar", label: "预约日历", icon: CalendarDays },
  { href: "/dashboard/call-recordings", label: "通话管理", icon: PhoneCall },
  { href: "/dashboard/manager", label: "主管总览", icon: BarChart3 },
  { href: "/dashboard/assessments", label: "测评表管理", icon: ClipboardList },
  { href: "/dashboard/knowledge", label: "知识库管理", icon: DatabaseZap },
  { href: "/dashboard/templates", label: "模板管理", icon: LibraryBig },
  { href: "/dashboard/settings/statuses", label: "状态设置", icon: Settings },
];

export async function DashboardSidebar() {
  const session = await auth();
  const visibleLinks =
    session?.user && isManagerOrAdmin(session.user.role)
      ? links
      : links.filter(
          (link) =>
            ![
              "/dashboard/manager",
              "/dashboard/assessments",
              "/dashboard/knowledge",
              "/dashboard/templates",
              "/dashboard/settings/statuses",
            ].includes(link.href),
        );

  return (
    <aside
      data-dashboard-sidebar
      className="hidden w-[11rem] shrink-0 border-r border-slate-200/80 bg-white/80 px-2.5 py-6 backdrop-blur xl:block"
    >
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Insight2Sale</p>
        <h1 className="mt-2 text-[2rem] font-semibold leading-tight text-slate-950">智慧父母 CRM</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          围绕测评、解读、直播和课程转化组织销售动作的工作台。
        </p>
      </div>
      <nav className="space-y-2">
        {visibleLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 leading-snug">{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
