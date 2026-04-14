"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RadarChartCard } from "@/components/charts/radar-chart-card";

type RadarDatum = { dimension: string; score: number; fullMark: number };

interface CustomerWorkspaceRadarsProps {
  childRadar: RadarDatum[];
  parentRadar: RadarDatum[];
  /** 与主内容区并排时的外层 class（含 grid 等） */
  inlineGridClassName?: string;
}

/**
 * 解读工作台：主内容区展示双雷达；向下滚动离开视口后，在左侧（对齐主导航栏）固定显示紧凑版，便于对照 SOP 解读。
 */
export function CustomerWorkspaceRadars({
  childRadar,
  parentRadar,
  inlineGridClassName,
}: CustomerWorkspaceRadarsProps) {
  const inlineAnchorRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [docked, setDocked] = useState(false);
  const [dockBox, setDockBox] = useState({ left: 16, width: 168 });

  const updateDockPosition = useCallback(() => {
    const xl = window.matchMedia("(min-width: 1280px)").matches;
    const aside = document.querySelector<HTMLElement>("[data-dashboard-sidebar]");
    if (xl && aside && aside.offsetWidth > 0) {
      const r = aside.getBoundingClientRect();
      const pad = 6;
      setDockBox({ left: r.left + pad, width: Math.max(140, r.width - pad * 2) });
    } else {
      const w = Math.min(168, Math.floor(window.innerWidth * 0.42));
      setDockBox({ left: 16, width: w });
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    updateDockPosition();
    window.addEventListener("resize", updateDockPosition);
    return () => window.removeEventListener("resize", updateDockPosition);
  }, [updateDockPosition]);

  useEffect(() => {
    const el = inlineAnchorRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setDocked(!entry.isIntersecting);
      },
      { root: null, threshold: 0, rootMargin: "0px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (docked) updateDockPosition();
  }, [docked, updateDockPosition]);

  const dock =
    mounted &&
    docked &&
    createPortal(
      <div
        className="pointer-events-auto max-h-[min(calc(100vh-5.5rem),520px)] overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-md xl:max-h-[min(calc(100vh-5rem),560px)]"
        style={{
          position: "fixed",
          top: "4.5rem",
          left: dockBox.left,
          width: dockBox.width,
          zIndex: 50,
        }}
        aria-hidden={false}
      >
        <div className="flex flex-col gap-2">
          <RadarChartCard
            compact
            className="w-full min-w-0"
            title="孩子 6 维"
            color="#10b981"
            data={childRadar}
          />
          <RadarChartCard
            compact
            className="w-full min-w-0"
            title="家长 6 维"
            color="#6366f1"
            data={parentRadar}
          />
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      <div
        ref={inlineAnchorRef}
        className={inlineGridClassName}
        data-customer-inline-radars
      >
        <div className="flex min-h-0 min-w-0">
          <RadarChartCard
            fillAvailableHeight
            className="min-h-0 w-full"
            title="孩子 6 维度雷达图"
            color="#10b981"
            data={childRadar}
          />
        </div>
        <div className="flex min-h-0 min-w-0">
          <RadarChartCard
            fillAvailableHeight
            className="min-h-0 w-full"
            title="家长 6 维度雷达图"
            color="#6366f1"
            data={parentRadar}
          />
        </div>
      </div>
      {dock}
    </>
  );
}
