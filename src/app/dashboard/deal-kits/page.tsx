import { ActionFeedbackForm } from "@/components/forms/action-feedback-form";
import { DealKitOcrForm } from "@/components/deal-kit/deal-kit-ocr-form";
import { DealKitSearchPanel } from "@/components/deal-kit/deal-kit-search-panel";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { createDealKitEntry, deleteDealKitEntry, updateDealKitEntry } from "@/server/actions/deal-kit";
import { getDealKitPageData } from "@/features/deal-kit/queries";
import { isManagerOrAdmin } from "@/lib/role-access";

export default async function DealKitsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const data = await getDealKitPageData(resolved?.q);
  if (!data) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">成交锦囊</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950 sm:text-3xl">把别人已经成交过的经验，变成你现在就能用的话术</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          销售在电话里常见的卡点，不需要从零想。直接把当前问题输进来，系统会按语义找出以前谁也遇到过这个问题、当时是怎么判断、怎么推进、怎么成交的。
        </p>
        <form className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]" method="get">
          <input
            className="w-full rounded-[1.25rem] border border-slate-200 px-4 py-4 text-base"
            defaultValue={data.query}
            name="q"
            placeholder="例如：妈妈担心学了以后孩子也学不会"
          />
          <button className="rounded-[1.25rem] bg-slate-950 px-6 py-4 text-sm font-semibold text-white">开始搜索</button>
        </form>
      </section>

      {data.query ? (
        data.results.length ? (
          <DealKitSearchPanel query={data.query} results={data.results} />
        ) : (
          <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500">
            暂时没有搜索到相似的成交经验。你可以先手工录入一条，后面团队再搜到它。
          </section>
        )
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ActionFeedbackForm action={createDealKitEntry} successMessage="成交锦囊已保存。">
          <input name="sourceType" type="hidden" value="manual" />
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">手工录入</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">把你刚刚解决掉的卡点记下来</h2>
            <div className="mt-5 space-y-3">
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                defaultValue={data.session.user.name ?? ""}
                name="contributorName"
                placeholder="贡献人"
              />
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
                name="profileText"
                placeholder="用户画像：这个家长/孩子/家庭当前是什么情况"
              />
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
                name="judgmentText"
                placeholder="用户判断：你觉得她真正卡在哪，顾虑是什么"
              />
              <textarea
                className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3"
                name="experienceText"
                placeholder="成交经验：你最后是怎么推进、怎么让她愿意继续往前走的"
              />
            </div>
            <PendingSubmitButton
              className="mt-4 w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              idleLabel="保存为成交锦囊"
              pendingLabel="正在存入成交锦囊..."
            />
          </div>
        </ActionFeedbackForm>

        {isManagerOrAdmin(data.session.user.role) ? (
          <DealKitOcrForm defaultContributorName={data.session.user.name ?? ""} />
        ) : (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">管理者入口</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">OCR 截图整理</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              群聊截图 OCR 整理功能默认只开放给主管和管理员，用于统一沉淀团队里已经出现过的成交经验。
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 xl:col-span-1">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">曝光榜</p>
          <div className="mt-4 space-y-3">
            {data.rankings.exposures.length ? (
              data.rankings.exposures.map((item, index) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-950">
                    {index + 1}. {item.contributorName}
                  </p>
                  <p className="mt-1">被搜到 {item.searchExposureCount} 次</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">还没有上榜记录。</p>
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 xl:col-span-1">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">引用榜</p>
          <div className="mt-4 space-y-3">
            {data.rankings.citations.length ? (
              data.rankings.citations.map((item, index) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-950">
                    {index + 1}. {item.contributorName}
                  </p>
                  <p className="mt-1">被引用 {item.citationCount} 次</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">还没有上榜记录。</p>
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 xl:col-span-1">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">助攻榜</p>
          <div className="mt-4 space-y-3">
            {data.rankings.conversions.length ? (
              data.rankings.conversions.map((item, index) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-950">
                    {index + 1}. {item.contributorName}
                  </p>
                  <p className="mt-1">帮助成交 {item.conversionAssistCount} 次</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">还没有上榜记录。</p>
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 xl:col-span-1">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">最近新增</p>
          <div className="mt-4 space-y-3">
            {data.recentEntries.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">{item.contributorName}</p>
                <p className="mt-1 text-xs text-slate-500">{item.createdAtLabel}</p>
                <p className="mt-2 line-clamp-4 leading-7">{item.experienceText}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">成交锦囊管理</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">查询、修改和删除都在这里</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          下面展示最近新增的成交锦囊。管理员、主管，以及录入人本人，都可以直接在这里修改或删除。
        </p>
        <div className="mt-5 space-y-4">
          {data.recentEntries.map((item) => (
            <article key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-white px-3 py-1">贡献人：{item.contributorName}</span>
                <span className="rounded-full bg-white px-3 py-1">记录人：{item.recorderName}</span>
                <span className="rounded-full bg-white px-3 py-1">{item.createdAtLabel}</span>
                <span className="rounded-full bg-white px-3 py-1">曝光 {item.searchExposureCount}</span>
                <span className="rounded-full bg-white px-3 py-1">引用 {item.citationCount}</span>
                <span className="rounded-full bg-white px-3 py-1">助攻 {item.conversionAssistCount}</span>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                <p><span className="font-semibold text-slate-950">用户画像：</span>{item.profileText}</p>
                <p><span className="font-semibold text-slate-950">用户判断：</span>{item.judgmentText}</p>
                <p><span className="font-semibold text-slate-950">成交经验：</span>{item.experienceText}</p>
              </div>

              {item.canManage ? (
                <details className="mt-4 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-900">修改 / 删除这条成交锦囊</summary>
                  <div className="mt-4 space-y-4">
                    <ActionFeedbackForm action={updateDealKitEntry} successMessage="成交锦囊已更新。">
                      <input name="id" type="hidden" value={item.id} />
                      <div className="space-y-3">
                        <input
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                          defaultValue={item.contributorName}
                          name="contributorName"
                        />
                        <textarea
                          className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                          defaultValue={item.profileText}
                          name="profileText"
                        />
                        <textarea
                          className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                          defaultValue={item.judgmentText}
                          name="judgmentText"
                        />
                        <textarea
                          className="min-h-36 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                          defaultValue={item.experienceText}
                          name="experienceText"
                        />
                      </div>
                      <PendingSubmitButton
                        className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        idleLabel="保存修改"
                        pendingLabel="正在保存修改..."
                      />
                    </ActionFeedbackForm>

                    <ActionFeedbackForm action={deleteDealKitEntry} successMessage="成交锦囊已删除。">
                      <input name="id" type="hidden" value={item.id} />
                      <PendingSubmitButton
                        className="w-full rounded-2xl border border-rose-300 px-4 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        idleLabel="删除这条成交锦囊"
                        pendingLabel="正在删除..."
                      />
                    </ActionFeedbackForm>
                  </div>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
