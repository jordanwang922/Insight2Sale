"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface RadarChartCardProps {
  title: string;
  color: string;
  data: Array<{ dimension: string; score: number; fullMark: number }>;
  /** 与左侧等高容器配合：绘图区在「至少 h-72」基础上均分纵向剩余空间 */
  fillAvailableHeight?: boolean;
  /** 解读台并排：较矮、较窄占位，与 fillAvailableHeight 互斥 */
  compact?: boolean;
  className?: string;
}

function wrapDimensionLabel(label: string) {
  if (label === "接纳情绪") {
    return ["接纳", "情绪"];
  }
  return [label];
}

/** compact 窄容器：左右顶点用单字竖排，省横向宽度（Recharts 传入的 x,y 为刻度外侧锚点） */
function linesForTick(
  label: string,
  compact: boolean,
  x: number,
  cx: number,
  tickIndex?: number,
): string[] {
  const t = String(label ?? "");
  if (!compact) {
    return wrapDimensionLabel(t);
  }
  const dx = Number.isFinite(cx) ? Math.abs(x - cx) : NaN;
  const sideByGeometry = Number.isFinite(dx) && dx > 12;
  /** 六维顺序为 需求→接纳情绪→沟通→家庭系统→自律→自主 时，第 2/3/5/6 个为左右侧 */
  const sideByIndex =
    tickIndex !== undefined && [1, 2, 4, 5].includes(tickIndex % 6);
  if (sideByGeometry || sideByIndex) {
    return Array.from(t);
  }
  return wrapDimensionLabel(t);
}

export function RadarChartCard({
  title,
  color,
  data,
  fillAvailableHeight = false,
  compact = false,
  className,
}: RadarChartCardProps) {
  const stretch = fillAvailableHeight && !compact;
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-slate-950/85 text-white shadow-[0_25px_80px_rgba(15,23,42,0.35)]",
        compact ? "p-3.5" : "p-5",
        stretch && "flex h-full min-h-0 flex-col",
        className,
      )}
    >
      <div className={cn("mb-4 flex shrink-0 items-center justify-between", stretch && "mb-3", compact && "mb-2")}>
        <h3 className={cn("font-semibold", compact ? "text-sm leading-snug" : "text-base")}>{title}</h3>
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div
        className={cn(
          compact && "h-44",
          !compact && !stretch && "h-72",
          stretch && "min-h-72 flex-1 min-w-0",
        )}
      >
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.16)" />
              <PolarAngleAxis
                dataKey="dimension"
                stroke="rgba(255,255,255,0.88)"
                tick={(props) => {
                  const payload = props.payload as { value?: string; coordinate?: number };
                  const x = Number(props.x);
                  const y = Number(props.y);
                  const raw = props as Record<string, unknown>;
                  const cx = Number(raw.cx);
                  const tickIndex = typeof raw.index === "number" ? raw.index : undefined;
                  const textAnchor = props.textAnchor as "start" | "middle" | "end";
                  const label = String(payload?.value ?? "");
                  const lines = linesForTick(label, compact, x, cx, tickIndex);
                  const fontSize = compact ? 10 : 12;
                  const lineHeight = compact ? 11 : 14;
                  const stackOffset =
                    lines.length > 1 ? -((lines.length - 1) * lineHeight) / 2 : 0;
                  return (
                    <text
                      x={x}
                      y={y + stackOffset}
                      textAnchor={textAnchor}
                      fill="rgba(255,255,255,0.88)"
                      fontSize={fontSize}
                    >
                      {lines.map((line, index) => (
                        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  );
                }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                stroke="rgba(255,255,255,0.2)"
                tick={false}
              />
              <Radar
                dataKey="score"
                stroke={color}
                fill={color}
                fillOpacity={0.28}
                isAnimationActive={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 text-center text-sm text-slate-300">
            暂无测评雷达数据
          </div>
        )}
      </div>
    </div>
  );
}
