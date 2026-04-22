# 交接日志

> 文件用途：给下一个 AI 或开发者快速接手当前项目。  
> 使用方式：阶段性更新「当前状态 / 关键路径 / 下一步 / 风险」。  
> 历史长篇记录如需可查 `docs/logs/archive/development-log-through-2026-04-12.md`（开发日志归档）。

---

## 当前状态（v1.0.0 + 管理员与组织 + 测评 Word v2）

- **版本**：`package.json` → **1.0.0**；Git 发布 tag：**`v1.0.0`**（与 package 一致）。
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
| 客户解读台页 | `src/app/dashboard/customers/[customerId]/page.tsx` |
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
