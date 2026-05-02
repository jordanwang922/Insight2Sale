# 交接日志

> 文件用途：给下一个 AI 或开发者快速接手当前项目。  
> 使用方式：阶段性更新「当前状态 / 关键路径 / 下一步 / 风险」。  
> 历史长篇记录如需可查 `docs/logs/archive/development-log-through-2026-04-12.md`（开发日志归档）。

---

## 当前状态（v1.2.0 + 管理员与组织 + 测评 Word v2）

- **版本**：`package.json` → **1.2.0**；Git 发布 tag：**`v1.2.0`**（与 package 一致）；上一冻结 tag：**`v1.0.0`**。
- **2026-04-30 测评报告评分修正**
  - 第 **37-39 / 40-42 / 43-45** 题显示标签分别为 **家长的教育焦虑指数 / 家长的教育倦怠指数 / 家长的教养能力感**；这是 `questions.ts` 对生成题库的显示覆盖，避免 Word 生成文件里仍是 `需求`。
  - **9 型家长养育类型**按用户确认规则：情感支持度=维度 1+2+3 家长侧原始分，规则引导度=维度 4+5+6 家长侧原始分；37-45=高、27-36=中、0-26=低；矩阵为高高权威型、中高温和管控型、低高独裁型、高中爱心管家型、中中温柔引导型、低中冷静管理型、高低放任型、中低温情弹性型、低低忽视型；`normalizeAssessmentReport` 会对旧快照按 raw 分重算展示类型。
  - **三指数**按 3 题原始分 `/15*100` 取整并显示 **xx分**；焦虑：0-3 从容、4-8 比较焦虑、9-15 很焦虑；倦怠：0-3 轻松、4-8 比较疲惫、9-15 很疲惫；能力感：0-3 能力弱、4-8 待提升、9-15 能力强。
  - **报告知识库文案**：家长类型卡优先从 **「父母养育的9种类型解读」** 当前类型列取 **「一句话总结」**；类型重点提醒优先从 **「家长9型解析」** 当前类型列取 **「给你一句关键提醒」**、**「你需要重点修炼的父母品质」**。入口：`lookupParentTypeReportCopy`。
  - 页面文案中 **「销售顾问」已改为「学习顾问」**。
  - **解读台同步要求**：`getCustomerWorkspace` 已在查询层先 `normalizeAssessmentReport`，所以知识库取文、通话模式、报告卡片、客户详情页都使用重算后的家长类型；客户列表页也 normalize 后展示类型。若以后新增解读台模块，必须使用 normalized report，不要直接读快照里的 `parentType.name`。
  - **解读台长文保留**：`parentTypeSummary` / `parentTypePracticeSections` 是新增指定板块；`parentTypeSnippet` 必须继续保留原知识库当前类型整列长文。解读台显示顺序为：指定关键提醒/修炼品质 → 原长文；SOP 模版块不应被删除。
  - **解读台首屏布局**：当前为左窄右宽两栏。左侧是四段：极简家长类型卡（格式为 **家长类型：冷静管理型**）→ 压低高度的黑色雷达 → 家长综合摘要 → 孩子综合摘要；右侧只放各维度详细分析大框。不要再把摘要放回右侧顶部；黑色雷达不要再强制拉高，否则下面两条摘要无法补齐右栏高度。
  - **解读台雷达浮动规则**：内联大雷达现在为压低高度，不强制正方形；左侧浮动小雷达只有内联大雷达从屏幕上方滚出后才出现，避免刚进页面挡住左侧菜单。
  - **分享长图布局**：家长类型块直接显示「一句话总结」并紧跟两段知识库提醒；雷达卡为正方形；课程学习建议和底部概念脚注暂不显示。
  - **错误容错**：已有 `src/app/error.tsx` / `src/app/global-error.tsx` 中文错误兜底；登录失败由 `submitLogin` 捕获 `AuthError` 后回 `/login?error=...` 显示明确提示；测评未答完由前端提示已答题数。后续新增 Server Action 时，业务校验优先返回/展示中文错误，不要直接把可预期错误 `throw` 成页面崩溃。
  - **保存反馈与防重复**：客户页、日历、团队总览、状态设置的主要保存表单已使用 `ActionFeedbackForm`，会提交中禁用、成功提示、失败提示。服务端对相同预约/跟进记录做 30 秒幂等，状态未变化时不再新增流转历史。后续新增保存按钮应优先复用该组件。
  - **状态流转历史分页**：客户详情页通过 `transitionsPage` 查询参数分页，数据源在 `getCustomerWorkspace(customerId, { statusTransitionPage })`。
  - **首页状态统计口径**：`/dashboard` 状态卡统计的是「到达过该状态的客户数」，包含当前状态与历史 `StatusTransition.toStatusId`，同一客户同一状态去重。不要改回仅按最终 `Customer.currentStatusId` 统计。
  - **首页首屏高度**：今日预约列表在右侧内部滚动，左侧黑色总览卡不再跟随右侧预约数量拉长。
  - **知识库总览页**：`/dashboard/knowledge` 已移除「检索与状态」长列表，避免总览页过长；知识条目管理从分类页或编辑页进入。
- **智慧父母测评 v2（2026-04-22）**
  - **Word 真源**：`docs/client/智慧父母测评-v2.docx`。题库生成：`npm run assessment:gen-from-docx`；**与仓库一致性校验**：`npm run assessment:verify-word`（失败即 doc 与代码不一致）。
  - **客户表**：`Customer.residenceCity`（迁移 `prisma/migrations/20260422120000_customer_residence_city`）；生产勿忘 **`npx prisma migrate deploy`**。
  - **计分与报告**：`src/features/assessment/scoring.ts`（Word 分档与 9 型矩阵）、`report-normalize.ts`（旧快照兼容）、`report-word-copy.ts`（脚注）；用户结果页 + 长图 + 解读台（SOP 仍为原解读台模版流程）见 `assessment/result/*`、`assessment-report-*`、`customers/[customerId]/page.tsx`。
  - **部署说明**：**`docs/deployment/SERVER_DEPLOYMENT.md`**（生产路径 **`/var/www/crm001/Insight2Sale`**、迁移、PM2、Nginx、`storage/`）。
  - **本轮（2026-04-12）**：测评页去掉大纲四块、题数动态、采集第 4/11 题调整、题干去参考量表括号、提交 **`await`** 修复、**`<html suppressHydrationWarning>`**、分享长图布局与 **`forSharePng`** 手机字号、解读台 **`stripDeskNineTypePreviewBlock`**（去掉 9 型图 8 + 上下话术，模版与知识库旧文均可剥）。
- **生产库 `Customer.residenceCity`（必做）**
  - 理想：**`cd /var/www/crm001/Insight2Sale && npx prisma migrate deploy`**（须迁移历史与库一致；若从未用过 Migrate 见 Prisma **Baseline** 文档后再 deploy）。
  - 若 **`migrate deploy` 报 P3005** 等历史不一致：可 **一次性** 在本机/预发验证过的环境下对生产执行 **`npx prisma db push`** 仅同步 schema（**生产慎用**，会绕过迁移文件记录；或手工执行 **`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "residenceCity" TEXT;`** 与 Prisma 一致）。完成后销售后台 **`customer.findMany`** 才不再报错。
- **产品定位**：测评 + 销售 CRM（解读台、客户、日历、知识库、**主管视图 + 管理员组织总览**），非单一测评工具。
- **知识库 RAG 向量**：**火山方舟豆包 Embedding**；向量存 PostgreSQL `KnowledgeChunk.embeddingJson`。须 `ARK_EMBEDDING_MODEL`；多模态 Vision 须 `ARK_EMBEDDING_USE_MULTIMODAL=1`。未配置时降级 `local-hash-v1`。全量重算：`npm run db:reembed-knowledge`。设计见 **`docs/design/system-design.md` §28**。
- **通话录音（v0.8 延续）**：解读台宽屏录音条 → 豆包语音转写 / 方舟纪要 → `/dashboard/call-recordings`；详见 §11.5、§27。
- **v1.0 账号与安全**
  - **新建用户默认密码**（销售 / 主管）：环境变量 **`DEFAULT_NEW_USER_PASSWORD`**（至少 8 位，勿写入 Git）；代码见 **`getDefaultNewUserPassword()`**；`User.defaultPassword`。
  - **角色**：**`ADMIN`**（唯一管理员账号约定为 **`admin`**）仅建主管、看全组织；**`MANAGER`** 建销售；主管 **`adminId`** 指向管理员。
  - **首次登录强制改密**：`session.user.mustChangePassword`；未改密不能进 `/dashboard`；改密后自动进工作台（见 `change-password-form.tsx`）。
  - **默认密码重置**：`src/server/actions/users.ts` 中 `resetSalesUserPassword` 允许主管把直属销售重置为 `DEFAULT_NEW_USER_PASSWORD`；`resetManagerUserPassword` 允许管理员把主管重置为 `DEFAULT_NEW_USER_PASSWORD`。两者都会把 `User.defaultPassword = true`，所以被重置账号下次登录会强制改密。入口在 `/dashboard/manager` 新增账号卡片下方，需选择账号并点击 **重置密码**；按钮由 `ConfirmSubmitButton` 弹出页面内自定义确认弹窗，取消不会提交，确认才提交。
  - 主管在 **团队总览 → 新增销售**、管理员在 **组织总览 → 新增主管** 处有**醒目提示**默认密码与安全告知。
  - **云端补管理员（无 seed 演示数据时）**：迁移应用后生成 SQL（读 `.env` 中 `DEFAULT_NEW_USER_PASSWORD`）。**重定向到文件时请用** `npm run -s provision-admin-sql` **或** `node --import tsx scripts/generate-provision-admin-sql.ts`，避免 `npm run` 默认把以 `>` 开头的行写入文件导致 SQL 语法错误；再用 **`npx prisma db execute --file ... --schema prisma/schema.prisma`** 或 `psql`（需已 `export DATABASE_URL`）执行；勿将含真实哈希的 SQL 提交到 Git。
  - **本地若 `admin` 登录 `CredentialsSignin`**：确认 `.env` 已配置 **`DEFAULT_NEW_USER_PASSWORD`**；库结构含 `ADMIN`/`adminId` 后 **`npm run db:seed`** 或执行生成的 SQL；登录用户名在服务端已 **统一小写**。
- **v1.0 快捷入口（工作台）**：桌面为「打开测评 + 复制链接」；**手机**仅显示只读链接框（长按复制）。链接根地址由 **`getPublicSiteUrl()`**（请求头）拼接，部署公网后随访问域名变化；可选 **`NEXT_PUBLIC_SITE_URL`** 兜底。
- **v0.7 仍有效**：家长类型长文案来自 9 型矩阵列；通话模式简报来自矩阵行 + 最弱维等。

---

## 关键路径（必读代码）

| 领域 | 入口 |
|------|------|
| 设计基线 | `docs/design/system-design.md`（§11.5、§27、§28；**账号条款见路线图「账号管理补充」**） |
| 初始密码（环境变量） | `.env` → `DEFAULT_NEW_USER_PASSWORD`；读取 `src/config/default-credentials.ts` → `getDefaultNewUserPassword()` |
| 会话与首次改密 | `src/auth.ts`（JWT 内同步 `defaultPassword`）、`src/app/dashboard/layout.tsx` |
| 改密表单与自动跳转 | `src/components/forms/change-password-form.tsx` |
| 创建销售 / 主管 | `src/server/actions/users.ts` → `createSalesUser` / `createManagerUser`；UI `src/app/dashboard/manager/page.tsx`（管理员与主管视图分支） |
| 云端 provision admin | `npm run provision-admin-sql` → `scripts/generate-provision-admin-sql.ts`（须已应用含 `ADMIN`/`adminId` 的迁移）；说明见 `docs/sql/provision-admin.sql` |
| 公网站点根 URL | `src/lib/public-site-url.ts` |
| 快捷入口 | `src/components/dashboard/quick-actions.tsx` |
| 方舟知识库向量 | `src/lib/ai/ark-embedding.ts`、`src/features/knowledge/ingestion.ts`、`retrieval.ts` |
| 全量重算向量 | `npm run db:reembed-knowledge`、`scripts/reembed-knowledge-embeddings.ts` |
| 豆包语音 ASR | `src/lib/ai/doubao-speech.ts` |
| 通话 API | `src/app/api/call-recordings/**` |
| 矩阵列/行抽取 | `src/features/knowledge/parent-type-matrix.ts` |
| 报告家长类型精确取文 | `src/features/knowledge/interpretation-lookup.ts` → `lookupParentTypeReportCopy` |
| 客户解读台页 | `src/app/dashboard/customers/[customerId]/page.tsx`；数据源先走 `src/features/crm/queries.ts` 的 normalized report |
| 解读台模版剥离 9 型预告块 | `stripDeskNineTypePreviewBlock` → `src/features/sales/interpretation-desk-template.ts`；模版 `src/features/sales/assets/interpretation-desk-template.txt` |
| 分享长图 PNG | `src/components/assessment/assessment-report-share-panel.tsx`；`forSharePng` 子组件与 **`RadarChartCardDual.forSharePng`** |
| 开发日志 | `docs/logs/development-log.md` |
| 实机测豆包语音 | `scripts/test-volc-speech-live.ts` |

---

## 环境变量（常见）

- `DATABASE_URL`、`AUTH_SECRET`、`AUTH_URL` / `NEXTAUTH_URL`（须与浏览器访问根 URL 一致；dev 默认端口 **3001**）
- 可选 **`NEXT_PUBLIC_SITE_URL`**：canonical 站点根（代理未传 Host 时兜底），见 `.env.example`
- **方舟**：`ARK_BASE_URL`、`ARK_API_KEY`、`ARK_MODEL`、`ARK_TIMEOUT_MS`
- **方舟 Embedding**：`ARK_EMBEDDING_MODEL`；多模态另需 `ARK_EMBEDDING_USE_MULTIMODAL=1`；可选 `ARK_EMBEDDING_TIMEOUT_MS`
- **豆包语音**：`VOLC_SPEECH_*`
- **备选 Whisper**：`OPENAI_API_KEY`

详见 `.env.example`。

---

## 下一步建议

1. **部署与上线**：**`docs/deployment/SERVER_DEPLOYMENT.md`**（路径 **`/var/www/crm001/Insight2Sale`**、`git pull`、`npm ci`、`migrate deploy`、build、PM2、Nginx）；**`storage/`** 持久化；**`residenceCity`** 见上文「生产库」。
2. **验收**：首次改密全链路、快捷入口链接在 HTTPS 公网域名下是否正确。
3. **知识库**：生产配置 Embedding 接入点后按需 **`npm run db:reembed-knowledge`**。

---

## 已知风险

- 测评题库与评分规则仍在演进。
- 矩阵表头命名若与 9 型不一致，需扩展映射。
- 豆包 / 方舟超时或失败时关注日志与 `processingError`。
- **知识库**：未配置 `ARK_EMBEDDING_MODEL` 时检索为本地哈希；切换模型后须重算或保证 `embeddingModel` 一致。
- **多服务同机**：本机 `3000` 被占用时 dev 用 **3001**，勿与 `AUTH_URL` 不一致。
