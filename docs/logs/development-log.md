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

### 2026-04-12 管理员角色、组织总览与本地 admin 登录排查

- 本次目标：**单一管理员 `admin`**（`UserRole.ADMIN`）、主管挂 `adminId`、管理员仅建主管；新建用户默认密码 **`fscrm2026`**；云端可执行 **`docs/sql/provision-admin.sql`** 补管理员与挂靠；修复本地用 admin 登录报 **`CredentialsSignin`**。
- 完成内容：
  - **Schema / 迁移**：`UserRole.ADMIN`、`User.adminId` 及关系（`prisma/migrations/20260421103000_admin_role_admin_id`）；通话相关迁移见同目录较早文件。
  - **业务**：`createManagerUser`（仅管理员）、权限与 CRM 查询区分管理员/主管；`docs/sql/provision-admin.sql`。
  - **登录**：`src/auth.ts` 对用户名 **trim + toLowerCase** 再校验；`submitLogin` 同步小写，避免大小写不一致查不到用户。
  - **本地根因**：库中**无** `admin` 行，且曾缺 **`ADMIN` 枚举 / `adminId` 列**（仅用旧 `db push` 建库、未跑迁移历史时）；执行 **`npx prisma db push`** 对齐 schema 后 **`npm run db:seed`** 可写入 `admin` 并将 `tianmanager.adminId` 指向该管理员。
- 影响文件（摘）：`prisma/schema.prisma`、`prisma/migrations/20260421103000_admin_role_admin_id/migration.sql`、`src/auth.ts`、`src/server/actions/auth-login.ts`、`docs/sql/provision-admin.sql`、`docs/logs/*.md`
- 验证情况：本地 `db push` + `db:seed` 后 **`admin` + `fscrm2026`** 与 `bcrypt.compare` 通过；`npm run build` 此前已通过。
- 风险 / 注意事项：**生产**若已有库且无 `_prisma_migrations`，不能假设 `migrate deploy` 一步到位，需 [Prisma baseline](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/baselining) 或托管方推荐的「对齐迁移表」流程；本地可暂用 **`db push`** 快速对齐开发库。
- 下一步建议：云端 **`git pull`** → **`npm ci`** → **`npx prisma migrate deploy`**（或 baseline 后 deploy）→ **`npm run build`** → 执行 **`docs/sql/provision-admin.sql`**（或 seed，视是否接受演示数据）。

### 2026-04-16 v1.0.0 发布（首版冻结）

- 本次目标：发布 **v1.0.0**；账号与微信端体验收口；设计/开发/交接文档与 **README** 对齐；打 Git tag **`v1.0.0`** 并推送 **origin/main**。
- 完成内容：
  - **新销售默认密码**：`DEFAULT_SALES_PASSWORD`（`demo12345`）单点配置；`createSalesUser` / `seed` 共用；主管创建销售页**醒目提示**默认密码与安全告知。
  - **首次登录强制改密**：`User.defaultPassword` ↔ JWT/Session `mustChangePassword`；`/dashboard` 布局拦截；`/login` 已登录且未改密直达 `/password?required=1`；`changePassword` 成功后清标记；已登录改密成功 **自动跳转工作台**（无需再点链接）。
  - **微信 / 手机**：快捷入口分端——桌面「打开 + 复制」；手机仅链接框长按复制；测评完整 URL 服务端 `getPublicSiteUrl()` + 客户端兜底；解读台内嵌链接区 HTML 结构修正（避免块级控件非法嵌套于段落）。
  - **产品清理**：移除调试用「前端包」角标与相关文件；雷达图等若干 UI 与知识库管线延续 v0.8。
  - **文档**：`system-design.md` 账号条款更新；`development-log` / `handoff-log` / `README` 版本号与说明。
- 影响文件（摘）：`src/config/default-credentials.ts`、`src/auth.ts`、`src/app/dashboard/layout.tsx`、`src/app/login/page.tsx`、`src/app/password/page.tsx`、`src/components/forms/change-password-form.tsx`、`src/server/actions/users.ts`、`src/components/dashboard/quick-actions.tsx`、`src/lib/public-site-url.ts`、`docs/design/system-design.md`、`docs/logs/*.md`、`README.md`、`package.json`
- 验证情况：`npm test`、`npm run build` 通过（发布前已执行）。
- 风险 / 注意事项：生产务必配置 **`AUTH_URL` / `NEXTAUTH_URL`** 与公网访问一致；可选 **`NEXT_PUBLIC_SITE_URL`** 仅在代理未传 Host 时使用。
- 下一步建议：**部署文档**（环境与反代、数据库迁移、持久化 `storage/`、HTTPS）；生产监控方舟与豆包额度。

### 2026-04-15 知识库：豆包语义向量（Embedding）

- 本次目标：将知识库 RAG 从本地 `local-hash-v1` **切换为火山方舟豆包 Embedding**；检索与入库向量一致；支持 **Vision 接入点**（`/embeddings/multimodal`）；历史切片可全量重算。
- 完成内容：
  - **实现**：`src/lib/ai/ark-embedding.ts`（标准 `/embeddings` + 多模态 `/embeddings/multimodal`）；`buildKnowledgeChunks` 异步；`retrieveKnowledge` 按 `embeddingModel` 过滤；`ARK_EMBEDDING_MODEL`、`ARK_EMBEDDING_USE_MULTIMODAL`、`ARK_EMBEDDING_TIMEOUT_MS`。
  - **脚本**：`npm run db:reembed-knowledge` → `scripts/reembed-knowledge-embeddings.ts`。
  - **文档**：`docs/design/system-design.md` 新增 **§28**；修订 §23、§25；`.env.example` 注释。
  - **实跑**：全量重算约 1774 条切片成功（多模态并发）；`npm test`、`npm run build` 通过。
- 影响文件（摘）：`src/lib/ai/ark-embedding.ts`、`src/features/knowledge/ingestion.ts`、`retrieval.ts`、`ingest-document.ts`、`src/server/actions/knowledge.ts`、`prisma/seed.ts`、`package.json`、`scripts/reembed-knowledge-embeddings.ts`、`.env.example`、`docs/design/system-design.md`、`docs/logs/handoff-log.md`
- 验证情况：`npm test`、`npm run build`；`db:reembed-knowledge` 对方舟成功（需有效 `ARK_*` 与接入点）。
- 风险 / 注意事项：接入点 ID 须与控制台一致（曾出现日期笔误导致 404）；**Vision** 须 `ARK_EMBEDDING_USE_MULTIMODAL=1`；纯文本 Embedding 接入点可关多模态开关以提升批量性能。
- 下一步建议：生产环境监控方舟 Embedding 额度与限流；可选改用 `Doubao-embedding` / `large` 文本接入点减轻多模态请求量。

### 2026-04-15 v0.8.0 发布

- 本次目标：发布 **v0.8.0**；将 **网页端通话录音 + 豆包语音妙记式转写 + 方舟纪要** 纳入产品与文档基线；开发 / 交接日志更新；代码推送 **main**。
- 完成内容：
  - **通话录音**：解读台宽屏 `CustomerCallRecordingBar`（MediaRecorder）→ `POST /api/call-recordings`，音频存 `storage/call-recordings/`。
  - **转写**：优先 `transcribeWithDoubaoFlash`（`show_utterances`、分句入库 `transcriptSegmentsJson`）；备选 OpenAI Whisper；纪要 / 要点 `generateDoubaoJson`。
  - **页面**：`/dashboard/call-recordings` 列表与侧边栏入口；详情页 `TranscriptTimeline`（时间轴、点击跳转播放、复制全文）；列表说明文案单行展示。
  - **工程**：`postinstall` + `build` 前置 `prisma generate`；`prisma` 列入 `dependencies`；开发默认端口 **3001** 避免与本机其它服务抢 `3000`。
  - **文档**：`docs/design/system-design.md` 新增 §11.5、§27；§21 待确认项更新；`README` 版本说明；脚本 `scripts/test-volc-speech-live.ts` 便于验收豆包语音。
- 影响文件（摘）：`prisma/schema.prisma`、`prisma/migrations/*call_recording*`、`src/app/api/call-recordings/**`、`src/features/crm/call-recording-*.ts`、`src/lib/ai/doubao-speech.ts`、`src/components/call-recording/**`、`src/app/dashboard/call-recordings/**`、`package.json`、`docs/design/system-design.md`、`docs/logs/*`、`README.md`、`scripts/test-volc-speech-live.ts`
- 验证情况：`npm test`、`npm run build`；豆包语音可用 `node --env-file=.env --import tsx scripts/test-volc-speech-live.ts` 实机联调（需有效 `VOLC_SPEECH_*`）。
- 未完成项 / 风险：ECS / 生产须 **持久化 `storage` 或换对象存储**；数据库须执行迁移；勿将 `.env` 与录音提交仓库。
- 下一步建议：阿里云部署时配置反代超时与磁盘；按需将录音迁 OSS/COS。

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
