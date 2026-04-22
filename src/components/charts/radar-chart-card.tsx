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

type RadarDatum = { dimension: string; score: number; fullMark: number };

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

/** 同一坐标系叠加孩子与家长两条雷达线，维度标签只渲染一次 */
function SvgSixAxisRadarDual({
  childData,
  parentData,
  childColor,
  parentColor,
  compact,
  docked,
}: {
  childData: RadarDatum[];
  parentData: RadarDatum[];
  childColor: string;
  parentColor: string;
  compact: boolean;
  /** 左侧固定条：线条加粗、字更大、略放大绘图区 */
  docked?: boolean;
}) {
  const { child: cRows, parent: pRows, n } = alignDualRadar(childData, parentData);
  const axisSource = cRows.length >= pRows.length ? cRows : pRows;
  const dock = Boolean(compact && docked);
  const maxR = compact ? (dock ? 116 : 108) : 118;
  const labelR = maxR + (compact ? (dock ? 42 : 36) : 46);
  const fontSize = compact ? (dock ? 32 : 26) : 30;
  const strokeGrid = compact ? (dock ? 1.05 : 0.85) : 1;
  const edgeStrokeW = dock ? 3.1 : compact ? 1.8 : 2.2;
  const parentFill = dock ? 0.26 : 0.18;
  const childFill = dock ? 0.3 : 0.22;

  const angleAt = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;

  function pointsFor(data: RadarDatum[]) {
    return data.map((d, i) => {
      const angle = angleAt(i);
      const denom = d.fullMark > 0 ? d.fullMark : 100;
      const t = Math.min(1, Math.max(0, d.score / denom));
      const r = maxR * t;
      return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
    });
  }

  const childPts = pointsFor(cRows);
  const parentPts = pointsFor(pRows);

  const childPoly = childPts.map((p) => `${p.x},${p.y}`).join(" ");
  const parentPoly = parentPts.map((p) => `${p.x},${p.y}`).join(" ");

  const gridScales = [0.25, 0.5, 0.75, 1];
  const dimLabels = axisSource.slice(0, n).map((d) => d.dimension);

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
            stroke={dock ? "rgba(255,255,255,0.26)" : "rgba(255,255,255,0.16)"}
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
            stroke={dock ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.18)"}
            strokeWidth={strokeGrid}
          />
        );
      })}

      <polygon
        points={parentPoly}
        fill={parentColor}
        fillOpacity={parentFill}
        stroke={parentColor}
        strokeWidth={edgeStrokeW}
        strokeLinejoin="round"
        strokeOpacity={1}
      />
      <polygon
        points={childPoly}
        fill={childColor}
        fillOpacity={childFill}
        stroke={childColor}
        strokeWidth={edgeStrokeW}
        strokeLinejoin="round"
        strokeOpacity={1}
      />

      {dimLabels.map((dim, i) => {
        const ang = angleAt(i);
        const lx = CX + labelR * Math.cos(ang);
        const ly = CY + labelR * Math.sin(ang);
        const rawD = dim.trim();
        const maxLen = dock ? 8 : 6;
        const text =
          compact && rawD.length > maxLen ? `${rawD.slice(0, maxLen - 1)}…` : rawD;
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

function padSeries(data: RadarDatum[], n: number): RadarDatum[] {
  if (data.length >= n) return data.slice(0, n);
  const out = [...data];
  while (out.length < n) {
    out.push({ dimension: out[out.length - 1]?.dimension ?? "—", score: 0, fullMark: 100 });
  }
  return out;
}

/** 双系对齐到同一维度数；缺省的一条用 0 分同维度名补齐 */
function alignDualRadar(child: RadarDatum[], parent: RadarDatum[]): {
  child: RadarDatum[];
  parent: RadarDatum[];
  n: number;
} {
  const n = Math.max(3, child.length, parent.length);
  const childPadded = child.length ? padSeries(child, n) : zeroScoresLike(padSeries(parent, n));
  const parentPadded = parent.length ? padSeries(parent, n) : zeroScoresLike(padSeries(child, n));
  return { child: childPadded, parent: parentPadded, n };
}

function zeroScoresLike(rows: RadarDatum[]): RadarDatum[] {
  return rows.map((d) => ({ ...d, score: 0 }));
}

export interface RadarChartCardDualProps {
  title?: string;
  childRadar: Array<{ dimension: string; score: number; fullMark: number }>;
  parentRadar: Array<{ dimension: string; score: number; fullMark: number }>;
  childColor?: string;
  parentColor?: string;
  fillAvailableHeight?: boolean;
  compact?: boolean;
  /** 左侧滚动固定条专用：加粗曲线、提对比、放大标签与画布 */
  docked?: boolean;
  className?: string;
}

/**
 * 孩子 + 家长双系 6 维雷达，合并在同一图中（与分页拆成两张相对）。
 */
export function RadarChartCardDual({
  title = "孩子与家长 6 维度雷达图",
  childRadar,
  parentRadar,
  childColor = "#10b981",
  parentColor = "#6366f1",
  fillAvailableHeight = false,
  compact = false,
  docked = false,
  className,
}: RadarChartCardDualProps) {
  const stretch = fillAvailableHeight && !compact;
  const hasData = childRadar.length > 0 || parentRadar.length > 0;
  const dock = compact && docked;

  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-slate-950/85 text-white shadow-[0_25px_80px_rgba(15,23,42,0.35)]",
        compact ? "p-3.5" : "p-4 sm:p-5",
        dock && "p-4",
        stretch && "flex h-full min-h-0 flex-col",
        className,
      )}
    >
      <div
        className={cn(
          "mb-3 flex shrink-0 items-start justify-between gap-2 sm:mb-4",
          stretch && "mb-3",
          compact && "mb-2",
          dock && "mb-3",
        )}
      >
        <h3
          className={cn(
            "min-w-0 flex-1 font-semibold leading-snug",
            dock
              ? "text-base sm:text-lg"
              : compact
                ? "text-sm sm:text-base"
                : "text-[11px] leading-tight sm:text-sm md:text-base",
          )}
        >
          {title}
        </h3>
        <div
          className={cn(
            "flex shrink-0 flex-col items-end gap-1 font-medium text-white/90 sm:flex-row sm:items-center sm:gap-2",
            dock ? "gap-1.5 text-xs sm:text-sm" : "text-[11px] sm:text-xs",
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn("shrink-0 rounded-full", dock ? "h-3 w-3" : "h-2.5 w-2.5")}
              style={{ backgroundColor: childColor }}
            />
            孩子
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn("shrink-0 rounded-full", dock ? "h-3 w-3" : "h-2.5 w-2.5")}
              style={{ backgroundColor: parentColor }}
            />
            家长
          </span>
        </div>
      </div>
      <div
        className={cn(
          "w-full min-w-0 overflow-hidden [transform:translateZ(0)]",
          dock && "min-h-[340px] h-[22rem] sm:min-h-[380px] sm:h-96",
          compact && !dock && "min-h-[280px] h-72 sm:min-h-[300px] sm:h-80",
          !compact && !stretch && "min-h-[280px] h-[22rem] sm:min-h-[300px] sm:h-80",
          stretch && "min-h-80 flex-1",
        )}
      >
        {hasData ? (
          <SvgSixAxisRadarDual
            childData={childRadar}
            parentData={parentRadar}
            childColor={childColor}
            parentColor={parentColor}
            compact={compact}
            docked={docked}
          />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 text-center text-xs text-slate-300 sm:text-sm">
            暂无测评雷达数据
          </div>
        )}
      </div>
    </div>
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
