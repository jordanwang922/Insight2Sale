import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { RadarChartCard } from "@/components/charts/radar-chart-card";
import { DimensionAnalysisGrid } from "@/components/assessment/dimension-analysis-grid";
import { AssessmentReport } from "@/features/assessment/types";

type RadarChartDatum = {
  dimension: string;
  score: number;
  fullMark: number;
};

export default async function AssessmentResultPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;

  const submission = await prisma.assessmentSubmission.findUnique({
    where: { id: submissionId },
    include: { customer: true, reportSnapshot: true },
  });

  if (!submission?.reportSnapshot) {
    notFound();
  }

  const report = parseJson<AssessmentReport | null>(submission.reportSnapshot.reportData, null);
  const parentRadar = parseJson<RadarChartDatum[]>(submission.reportSnapshot.parentRadarData, []);
  const childRadar = parseJson<RadarChartDatum[]>(submission.reportSnapshot.childRadarData, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed_0%,#f8fafc_58%,#e2e8f0_100%)] px-4 py-8 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_40px_100px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Assessment Result</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 md:text-5xl">
            {submission.customer.wechatNickname} 的初步结果已经生成
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            这份报告会先帮助你看到孩子和家长各自的 6 个维度现状。后续销售顾问会结合你的具体场景，为你做更完整的 1V1 解读。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700">
              家长类型：{report?.parentType?.name ?? "-"}
            </span>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              总分：{report?.overallScore ?? 0}
            </span>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <RadarChartCard title="孩子 6 维度雷达图" color="#10b981" data={childRadar} />
          <RadarChartCard title="家长 6 维度雷达图" color="#6366f1" data={parentRadar} />
        </section>

        {report ? <DimensionAnalysisGrid dimensions={report.dimensionScores} /> : null}

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            ["教育焦虑指数", report?.anxiety?.percent ?? 0],
            ["养育倦怠指数", report?.burnout?.percent ?? 0],
            ["教养能力感", report?.competence?.percent ?? 0],
          ].map(([label, value]) => (
            <article key={label} className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-4xl font-semibold text-slate-950">{value}%</p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-slate-950">系统初步建议</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">{report?.matchAnalysis}</p>
          <ul className="mt-6 space-y-3">
            {report?.suggestions?.map((suggestion: string) => (
              <li key={suggestion} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                {suggestion}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
