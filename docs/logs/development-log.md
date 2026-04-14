# 开发日志

> 文件用途：记录每次开发完成了什么，帮助回溯改动历史。  
> 行数限制：本文件不超过 500 行。超过后必须归档到 `docs/logs/archive/`，然后重建本文件继续记录。  
> 记录原则：只记录高信号内容，不写流水账。  
> **2026-04-13 起**：v0.6 及更早的完整条目已归档至 `docs/logs/archive/development-log-through-2026-04-12.md`。

---

## 记录模板

### YYYY-MM-DD HH:mm

- 本次目标：
- 完成内容：
- 影响文件：
- 验证情况：
- 未完成项：
- 风险 / 注意事项：
- 下一步建议：

---

## 当前记录

### 2026-04-13 v0.7.0 发布

- 本次目标：发布 **v0.7.0**；工作台「家长类型解读」与「通话模式」与知识库 **Excel 矩阵**精确对齐（按列、按行，不混型）；开发/交接日志归档续写；代码推送 **main**。
- 完成内容：
  - **9 型矩阵列抽取**：`parent-type-matrix.ts` 表头识别、当前养育类型列、`【标题】\n正文` 输出；列名与系统类型支持后缀等价（如「权威型」↔「权威型父母」）；入库 `rawText` CSV 与磁盘 `.xlsx` 双路径。
  - **家长类型解读展示**：`parent-type-interpretation-parse.ts` 全局解析多段 `【】`；`ParentTypeInterpretationText`；客户页 `whitespace-pre-line`；标题全角括号 + 每段标题加粗略大于正文。
  - **通话模式简报**：`lookupCallModeMatrixSnippets` 仅从矩阵 **当前类型列** 取「隐性风险」「关键提醒」行；`call-mode-brief.ts` 拼 2～3 句（最弱维 + 类型名 + 矩阵风险/提醒 + 倦怠兜底 + 核心难题）；`CallModeBriefText` 关键词加粗；**不再**用豆包 `callMode` 三字段作为该区块主文案。
  - **interpretation-lookup**：`lookupParentTypeSnippet` 仅查标题含「父母养育的9种类型解读」「家长9型解析」的测评解读库文档。
  - **日志**：原开发日志全文归档 `docs/logs/archive/development-log-through-2026-04-12.md`；本文件自 v0.7 起重新计数。
  - **仓库卫生**：`.gitignore` 增加 `storage/`（本地上传）、根目录 `*.traineddata` 副本，避免误提交大文件与用户资料。
- 影响文件（摘）：`src/features/knowledge/parent-type-matrix.ts`、`interpretation-lookup.ts`、`src/features/crm/call-mode-brief.ts`、`src/components/sales/*`、`src/lib/parent-type-interpretation-parse.ts`、`src/app/dashboard/customers/[customerId]/page.tsx`、`tests/knowledge/`、`tests/lib/`、`tests/features/crm/`、`package.json`、`README.md`、`docs/logs/*`、`.gitignore`
- 验证情况：`npm test`、`npm run build` 通过（发布前已执行）。
- 风险 / 注意事项：矩阵行标题须与代码中「隐性风险 / 关键提醒」匹配规则一致，若 Excel 表头命名差异大需在 `rowMatchesRiskLabel` / `rowMatchesReminderLabel` 中扩展；本地 `storage/` 不上库，生产需配置持久化与备份策略。
- 下一步建议：真机验收通话模式简报与 9 型长文；按需将豆包 `callMode` 字段从 AI 输出类型中标记废弃或改作其它用途。
