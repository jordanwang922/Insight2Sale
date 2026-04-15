"use client";

import { cn } from "@/lib/utils";

interface RadarChartCardProps {
  title: string;
  color: string;
  data: Array<{ dimension: string; score: number; fullMark: number }>;
  fillAvailableHeight?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * viewBox 单位：窄屏上图宽约 160–180px 时，fontSize≈30 对应约 text-sm(14px) 量级的视觉字重。
 * （与 DimensionAnalysisGrid 里「孩子表现」的 text-sm 对齐。）
 */
const VB = 420;
const CX = VB / 2;
const CY = VB / 2;

function labelText(raw: string, compact: boolean): string {
  const t = String(raw ?? "").trim();
  if (!compact) return t;
  return t.length > 5 ? `${t.slice(0, 4)}…` : t;
}

function SvgSixAxisRadar({
  data,
  color,
  compact,
}: {
  data: Array<{ dimension: string; score: number; fullMark: number }>;
  color: string;
  compact: boolean;
}) {
  const n = Math.max(3, data.length);
  const maxR = compact ? 100 : 118;
  const labelR = maxR + (compact ? 30 : 46);
  const fontSize = compact ? 20 : 30;
  const strokeGrid = compact ? 0.85 : 1;

  const angleAt = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;

  const dataPoints = data.map((d, i) => {
    const angle = angleAt(i);
    const denom = d.fullMark > 0 ? d.fullMark : 100;
    const t = Math.min(1, Math.max(0, d.score / denom));
    const r = maxR * t;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  });
  const dataPoly = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const gridScales = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      className="h-full w-full min-h-[200px] select-none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {gridScales.map((s) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const ang = angleAt(i);
          const r = maxR * s;
          return `${CX + r * Math.cos(ang)},${CY + r * Math.sin(ang)}`;
        }).join(" ");
        return (
          <polygon
            key={s}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={strokeGrid}
          />
        );
      })}

      {Array.from({ length: n }, (_, i) => {
        const ang = angleAt(i);
        const x2 = CX + maxR * Math.cos(ang);
        const y2 = CY + maxR * Math.sin(ang);
        return (
          <line
            key={`ax-${i}`}
            x1={CX}
            y1={CY}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={strokeGrid}
          />
        );
      })}

      <polygon
        points={dataPoly}
        fill={color}
        fillOpacity={0.24}
        stroke={color}
        strokeWidth={compact ? 1.6 : 2}
        strokeLinejoin="round"
      />

      {data.map((d, i) => {
        const ang = angleAt(i);
        const lx = CX + labelR * Math.cos(ang);
        const ly = CY + labelR * Math.sin(ang);
        const text = labelText(d.dimension, compact);
        return (
          <text
            key={`lb-${i}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.95)"
            fontSize={fontSize}
            fontWeight={600}
            style={{ textRendering: "geometricPrecision" }}
          >
            {text}
          </text>
        );
      })}
    </svg>
  );
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
        compact ? "p-3.5" : "p-4 sm:p-5",
        stretch && "flex h-full min-h-0 flex-col",
        className,
      )}
    >
      <div
        className={cn(
          "mb-3 flex shrink-0 items-start justify-between gap-2 sm:mb-4",
          stretch && "mb-3",
          compact && "mb-2",
        )}
      >
        <h3
          className={cn(
            "min-w-0 flex-1 font-semibold leading-snug",
            compact ? "text-xs sm:text-sm" : "text-[11px] leading-tight sm:text-sm md:text-base",
          )}
        >
          {title}
        </h3>
        <span
          className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div
        className={cn(
          "w-full min-w-0 overflow-hidden [transform:translateZ(0)]",
          compact && "h-52 min-h-[208px]",
          !compact && !stretch && "min-h-[280px] h-[22rem] sm:min-h-[300px] sm:h-80",
          stretch && "min-h-80 flex-1",
        )}
      >
        {data.length ? (
          <SvgSixAxisRadar data={data} color={color} compact={compact} />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 text-center text-xs text-slate-300 sm:text-sm">
            暂无测评雷达数据
          </div>
        )}
      </div>
    </div>
  );
}
