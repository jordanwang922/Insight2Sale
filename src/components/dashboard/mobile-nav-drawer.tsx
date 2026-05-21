"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { getDashboardNavLinks } from "@/components/dashboard/nav-links";

export function DashboardMobileNavDrawer({
  role,
  userName,
}: {
  role: UserRole;
  userName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = useMemo(() => getDashboardNavLinks(role), [role]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "关闭菜单" : "打开菜单"}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm xl:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] xl:hidden">
          <button
            type="button"
            aria-label="关闭菜单遮罩"
            className="absolute inset-0 bg-slate-950/35"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex h-dvh w-[84vw] max-w-[20rem] flex-col overflow-hidden border-r border-slate-200 bg-white px-4 pb-5 pt-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Insight2Sale</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">智慧父母 CRM</h2>
                <p className="mt-2 text-sm text-slate-500">{userName}</p>
              </div>
              <button
                type="button"
                aria-label="关闭菜单"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pb-6">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      active ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
