import Link from "next/link";
import { redirect } from "next/navigation";
import { getPrimaryAssessment } from "@/features/crm/queries";

export default async function AssessmentEntryPage() {
  const primary = await getPrimaryAssessment();
  if (primary) {
    redirect(`/assessment/${primary.slug}`);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff9ef_0%,#fffdf8_56%,#f8fafc_100%)] px-5 py-10">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-amber-100 bg-white p-8 shadow-[0_40px_100px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-semibold text-slate-950">当前还没有启用中的主推测评</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">请先到主管后台配置测评表，并标记一份主推测评。</p>
        <Link href="/login" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          返回后台
        </Link>
      </div>
    </main>
  );
}
