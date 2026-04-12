"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface RadarChartCardProps {
  title: string;
  color: string;
  data: Array<{ dimension: string; score: number; fullMark: number }>;
}

function wrapDimensionLabel(label: string) {
  if (label === "接纳情绪") {
    return ["接纳", "情绪"];
  }
  return [label];
}

export function RadarChartCard({ title, color, data }: RadarChartCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/85 p-5 text-white shadow-[0_25px_80px_rgba(15,23,42,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="h-72">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.16)" />
              <PolarAngleAxis
                dataKey="dimension"
                stroke="rgba(255,255,255,0.88)"
                tick={({ payload, x, y, textAnchor }) => {
                  const lines = wrapDimensionLabel(String(payload?.value ?? ""));
                  return (
                    <text x={x} y={y} textAnchor={textAnchor} fill="rgba(255,255,255,0.88)" fontSize={12}>
                      {lines.map((line, index) => (
                        <tspan key={line} x={x} dy={index === 0 ? 0 : 14}>
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
