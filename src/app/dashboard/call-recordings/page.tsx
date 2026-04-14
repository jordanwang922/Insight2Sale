import Link from "next/link";
import { getCallRecordingsPageData } from "@/features/crm/queries";
import { RecordingCustomerSelect } from "@/components/call-recording/recording-customer-select";

function formatWhen(d: Date) {
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null) {
  if (seconds == null || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function CallRecordingsPage() {
  const data = await getCallRecordingsPageData();
  if (!data) return null;

  const { items, customers } = data;
  const options = customers.map((c) => ({ id: c.id, label: c.wechatNickname }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Insight2Sale</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">通话管理</h1>
        <p className="mt-2 overflow-x-auto text-sm leading-7 text-slate-600 whitespace-nowrap">
          查看网页端录制的通话：时间、时长、关联客户与处理状态。转写优先走豆包语音，纪要/要点由方舟豆包生成；解读台内可开始/停止录音（手机端无录音按钮）。
        </p>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">开始时间</th>
              <th className="px-4 py-3 font-medium">时长</th>
              <th className="px-4 py-3 font-medium">销售</th>
              <th className="px-4 py-3 font-medium">关联客户</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  暂无录音。请在客户解读台使用「开始录音」。
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-800">{formatWhen(row.startedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDuration(row.durationSeconds)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.owner.name}</td>
                  <td className="px-4 py-3">
                    <RecordingCustomerSelect recordingId={row.id} value={row.customerId} options={options} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {row.processingStatus === "done" ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">已完成</span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-900">{row.processingStatus}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      href={`/dashboard/call-recordings/${row.id}`}
                      className="text-sm font-medium text-amber-700 hover:underline"
                    >
                      查看纪要
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
