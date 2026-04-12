import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { RadarChartCard } from "@/components/charts/radar-chart-card";

describe("RadarChartCard", () => {
  test("shows an empty state when there is no radar data", () => {
    render(<RadarChartCard title="孩子 6 维度雷达图" color="#10b981" data={[]} />);

    expect(screen.getByText("暂无测评雷达数据")).toBeInTheDocument();
  });
});
