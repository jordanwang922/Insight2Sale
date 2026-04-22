"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RadarChartCardDual } from "@/components/charts/radar-chart-card";

type RadarDatum = { dimension: string; score: number; fullMark: number };

interface CustomerWorkspaceRadarsProps {
  childRadar: RadarDatum[];
  parentRadar: RadarDatum[];
  /** 与主内容区并排时的外层 class（含 grid 等） */
  inlineGridClassName?: string;
}

/**
 * 解读工作台：主内容区一张合并雷达（孩子+家长同色叠加）；滚动离开视口后在左侧固定紧凑版。
 */
export function CustomerWorkspaceRadars({
  childRadar,
  parentRadar,
  inlineGridClassName,
}: CustomerWorkspaceRadarsProps) {
  const inlineAnchorRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [docked, setDocked] = useState(false);
  const [dockBox, setDockBox] = useState({ left: 16, width: 240 });

  const updateDockPosition = useCallback(() => {
    const xl = window.matchMedia("(min-width: 1280px)").matches;
    const aside = document.querySelector<HTMLElement>("[data-dashboard-sidebar]");
    if (xl && aside && aside.offsetWidth > 0) {
      const r = aside.getBoundingClientRect();
      const pad = 6;
      setDockBox({ left: r.left + pad, width: Math.max(230, Math.min(310, r.width - pad * 2)) });
    } else {
      const w = Math.min(280, Math.max(220, Math.floor(window.innerWidth * 0.52)));
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
        className="pointer-events-auto max-h-[min(calc(100vh-5.5rem),580px)] overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-md xl:max-h-[min(calc(100vh-5rem),620px)]"
        style={{
          position: "fixed",
          top: "4.5rem",
          left: dockBox.left,
          width: dockBox.width,
          zIndex: 50,
        }}
        aria-hidden={false}
      >
        <RadarChartCardDual
          compact
          docked
          className="w-full min-w-0"
          title="孩子与家长 6 维"
          childRadar={childRadar}
          parentRadar={parentRadar}
        />
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
          <RadarChartCardDual
            fillAvailableHeight
            className="min-h-0 w-full"
            title="孩子与家长 6 维度雷达图"
            childRadar={childRadar}
            parentRadar={parentRadar}
          />
        </div>
      </div>
      {dock}
    </>
  );
}
