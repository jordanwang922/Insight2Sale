import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AssessmentForm } from "@/components/assessment/assessment-form";
import { assessmentTotalQuestionCount } from "@/features/assessment/questions";

export default async function AssessmentTemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = await prisma.assessmentTemplate.findUnique({
    where: { slug },
  });

  if (!template || !template.enabled) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff8eb_0%,#fffdf8_60%,#f8fafc_100%)] px-4 py-8 md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[2.5rem] border border-amber-100 bg-white shadow-[0_45px_120px_rgba(15,23,42,0.08)]">
          <section className="bg-[linear-gradient(180deg,#fff9ef_0%,#fffdf8_100%)] px-6 py-10 text-center md:px-12">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-500">
              ✦
            </div>
            <h1 className="mt-6 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
              {template.introTitle ?? template.title}
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
              {template.introBody ?? template.description}
            </p>

            <div className="mx-auto mt-8 max-w-2xl rounded-[2rem] bg-white/90 p-6 text-left shadow-sm">
              <p className="text-lg font-semibold text-slate-950">测评说明</p>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                <li>
                  1. 本测评共 {assessmentTotalQuestionCount} 道题目，约 10-15 分钟完成。
                </li>
                <li>2. 涵盖 6 个核心维度：需求、接纳情绪、沟通、家庭系统、自律、自主。</li>
                <li>3. 请根据您和孩子的真实行为表现选择，而非理想状态。</li>
                <li>4. 测评结果将帮助您看见养育优势、成长空间和后续学习重点。</li>
              </ol>
            </div>
          </section>

          <section className="border-t border-amber-100 px-6 py-8 md:px-12">
            <AssessmentForm templateSlug={template.slug} />
          </section>
        </div>
      </div>
    </main>
  );
}
